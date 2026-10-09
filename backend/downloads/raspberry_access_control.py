#!/usr/bin/env python3
"""
Gym24 - Control de Acceso con Raspberry Pi + Grabacion de Video
Graba 4 segundos de video al validar una ENTRADA.
"""

import os
import sys
import time
import logging
import threading
import subprocess
import socket
import shutil
import requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/gym24-access.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# GPIO
try:
    import RPi.GPIO as GPIO
    GPIO_AVAILABLE = True
except ImportError:
    logger.warning("GPIO no disponible - modo simulacion")
    GPIO_AVAILABLE = False

# Config
SERVER_URL = os.environ.get('GYMACCESS_SERVER_URL', 'https://api.gym24.app')
GYM_TOKEN = os.environ.get('GYMACCESS_GYM_TOKEN', '')
DEVICE_ID = os.environ.get('GYMACCESS_DEVICE_ID', '')
VIDEO_DEVICE = os.environ.get('VIDEO_DEVICE', '')
SERVICE_NAME = os.environ.get('GYMACCESS_SERVICE_NAME', 'gym24-access')
SOFTWARE_VERSION = '2.2'
HEARTBEAT_SECONDS = 20
_SI = ('1', 'true', 'si', 'yes')
INVERTIR_LECTORES = os.environ.get('INVERTIR_LECTORES', '0').strip().lower() in _SI
INVERTIR_RELES = os.environ.get('INVERTIR_RELES', '0').strip().lower() in _SI


def _auto_detect_video_device():
    """Auto-detecta el primer /dev/video* que funcione con v4l2."""
    import glob
    candidates = sorted(glob.glob('/dev/video*'))
    for path in candidates:
        try:
            # Probar si el device soporta captura de video (no solo metadatos)
            result = subprocess.run(
                ['v4l2-ctl', '--device', path, '--all'],
                capture_output=True, timeout=3
            )
            output = result.stdout.decode() + result.stderr.decode()
            # Un device que soporta captura menciona 'Video Capture' en sus capabilities
            if 'Video Capture' in output and 'Streaming' in output:
                return path
        except FileNotFoundError:
            # v4l2-ctl no instalado, fallback: aceptar el primero
            return path
        except Exception:
            continue
    # Si no encontro ninguno con v4l2-ctl, devolver el primero disponible
    return candidates[0] if candidates else None
VIDEO_DURATION = 4  # seconds
VIDEO_DIR = '/tmp/gym24_videos'

RELAY_ENTRADA = 12
RELAY_SALIDA = 16
TIEMPO_APERTURA = 3
DEBOUNCE_SEGUNDOS = 3  # ignora el mismo QR leido de nuevo (o por el otro lector) en este lapso

os.makedirs(VIDEO_DIR, exist_ok=True)


class AccessController:
    def __init__(self):
        self.running = True
        self._last_scan = {}
        self._scan_lock = threading.Lock()
        self.reader_names = []
        self.last_scan_at = None
        self.last_scan_result = None
        self._cpu_prev = None
        
        if GPIO_AVAILABLE:
            GPIO.setmode(GPIO.BCM)
            GPIO.setwarnings(False)
            GPIO.setup(RELAY_ENTRADA, GPIO.OUT, initial=GPIO.HIGH)
            GPIO.setup(RELAY_SALIDA, GPIO.OUT, initial=GPIO.HIGH)
            logger.info("GPIO inicializado")
        
        # Ping thread
        self.ping_thread = threading.Thread(target=self._ping_loop, daemon=True)
        self.ping_thread.start()
    
    # ==================== MONITOR / TELEMETRIA ====================

    def _local_ip(self):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
                sock.connect(("8.8.8.8", 80))
                return sock.getsockname()[0]
        except OSError:
            return None

    def _read_file(self, path):
        try:
            with open(path) as f:
                return f.read()
        except OSError:
            return None

    def _cpu_temp(self):
        raw = self._read_file('/sys/class/thermal/thermal_zone0/temp')
        return round(int(raw) / 1000, 1) if raw and raw.strip().isdigit() else None

    def _cpu_usage(self):
        raw = self._read_file('/proc/stat')
        if not raw:
            return None
        vals = [int(v) for v in raw.splitlines()[0].split()[1:]]
        idle, total = vals[3] + vals[4], sum(vals)
        prev, self._cpu_prev = self._cpu_prev, (idle, total)
        if not prev or total == prev[1]:
            return None
        return round(100 * (1 - (idle - prev[0]) / (total - prev[1])), 1)

    def _memory_usage(self):
        raw = self._read_file('/proc/meminfo')
        if not raw:
            return None
        info = {line.split(':')[0]: int(line.split()[1]) for line in raw.splitlines() if len(line.split()) > 1}
        total, avail = info.get('MemTotal'), info.get('MemAvailable')
        return round(100 * (1 - avail / total), 1) if total and avail is not None else None

    def _disk_usage(self):
        usage = shutil.disk_usage('/')
        return round(100 * usage.used / usage.total, 1)

    def _uptime(self):
        raw = self._read_file('/proc/uptime')
        return int(float(raw.split()[0])) if raw else None

    def _wifi_signal(self):
        raw = self._read_file('/proc/net/wireless')
        if not raw:
            return None
        lines = raw.strip().splitlines()[2:]
        if not lines:
            return None
        try:
            return int(float(lines[0].split()[3].rstrip('.')))
        except (IndexError, ValueError):
            return None

    def _camera(self):
        dev = VIDEO_DEVICE or _auto_detect_video_device()
        return dev if dev and os.path.exists(dev) else None

    def _telemetry(self):
        return {
            "gym_token": GYM_TOKEN,
            "local_ip": self._local_ip(),
            "hostname": socket.gethostname(),
            "cpu_temp": self._cpu_temp(),
            "cpu_usage": self._cpu_usage(),
            "memory_usage": self._memory_usage(),
            "disk_usage": self._disk_usage(),
            "uptime": self._uptime(),
            "wifi_signal": self._wifi_signal(),
            "software_version": SOFTWARE_VERSION,
            "qr_readers": self.reader_names,
            "camera": self._camera(),
            "last_scan_at": self.last_scan_at,
            "last_scan_result": self.last_scan_result,
            "invert_readers": INVERTIR_LECTORES,
            "invert_relays": INVERTIR_RELES,
        }

    def _ping_loop(self):
        while self.running:
            try:
                r = requests.post(f"{SERVER_URL}/api/devices/{DEVICE_ID}/heartbeat", json=self._telemetry(), timeout=8)
                if r.status_code in (404, 405) and 'no encontrado' not in r.text.lower():
                    # Servidor antiguo sin /heartbeat
                    requests.post(f"{SERVER_URL}/api/devices/{DEVICE_ID}/ping", params={"gym_token": GYM_TOKEN}, timeout=5)
                elif r.ok and r.json().get("command"):
                    data = r.json()
                    threading.Thread(target=self._run_command, args=(data["command_id"], data["command"]), daemon=True).start()
            except Exception as e:
                logger.debug(f"Heartbeat fallido: {e}")
            time.sleep(HEARTBEAT_SECONDS)

    def _report_command(self, command_id, success, output):
        try:
            requests.post(
                f"{SERVER_URL}/api/devices/{DEVICE_ID}/command-result",
                json={"gym_token": GYM_TOKEN, "command_id": command_id, "success": success, "output": output},
                timeout=8,
            )
        except Exception as e:
            logger.error(f"No se pudo reportar resultado de comando: {e}")

    def _run_command(self, command_id, command):
        logger.info(f"Comando remoto recibido: {command}")
        try:
            if command == 'open_entrada':
                self.abrir_torno('entrada')
                self._report_command(command_id, True, "Torno ENTRADA abierto")
            elif command == 'open_salida':
                self.abrir_torno('salida')
                self._report_command(command_id, True, "Torno SALIDA abierto")
            elif command == 'test_video':
                filepath = f"{VIDEO_DIR}/test_{int(time.time())}.mp4"
                error = self._record_clip(filepath)
                if error:
                    self._report_command(command_id, False, error)
                else:
                    size = os.path.getsize(filepath)
                    os.remove(filepath)
                    self._report_command(command_id, True, f"Video de {VIDEO_DURATION}s grabado OK ({size // 1024} KB)")
            elif command == 'restart_service':
                self._report_command(command_id, True, f"Reiniciando servicio {SERVICE_NAME}...")
                subprocess.run(['sudo', 'systemctl', 'restart', SERVICE_NAME], timeout=30)
            elif command == 'reboot':
                self._report_command(command_id, True, "Reiniciando Raspberry...")
                subprocess.run(['sudo', 'reboot'], timeout=30)
            else:
                self._report_command(command_id, False, f"Comando desconocido: {command}")
        except Exception as e:
            logger.error(f"Error ejecutando comando {command}: {e}")
            self._report_command(command_id, False, f"Error: {e}")

    def abrir_torno(self, direccion):
        pin = RELAY_ENTRADA if direccion == 'entrada' else RELAY_SALIDA
        if INVERTIR_RELES:
            pin = RELAY_SALIDA if pin == RELAY_ENTRADA else RELAY_ENTRADA
        nombre = "ENTRADA" if direccion == 'entrada' else "SALIDA"
        logger.info(f"Abriendo torno {nombre}")
        if GPIO_AVAILABLE:
            GPIO.output(pin, GPIO.LOW)
            time.sleep(TIEMPO_APERTURA)
            GPIO.output(pin, GPIO.HIGH)
        else:
            time.sleep(TIEMPO_APERTURA)
        logger.info(f"Torno {nombre} cerrado")
    
    def _record_clip(self, filepath):
        """Graba VIDEO_DURATION segundos en filepath. Devuelve mensaje de error o None."""
        video_dev = VIDEO_DEVICE or _auto_detect_video_device()
        if not video_dev or not os.path.exists(video_dev):
            available = os.popen('ls /dev/video* 2>/dev/null').read().strip() or 'NINGUNO'
            return f"Camara no encontrada. VIDEO_DEVICE='{VIDEO_DEVICE}'. Dispositivos: {available}"
        cmd = [
            'ffmpeg', '-y', '-f', 'v4l2', '-video_size', '640x480', '-framerate', '15',
            '-i', video_dev, '-t', str(VIDEO_DURATION),
            '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28', filepath
        ]
        logger.info(f"Grabando video ({video_dev}): {filepath}")
        try:
            result = subprocess.run(cmd, capture_output=True, timeout=VIDEO_DURATION + 5)
        except subprocess.TimeoutExpired:
            return "Timeout grabando video"
        if result.returncode != 0:
            return f"Error ffmpeg en {video_dev}: {result.stderr.decode()[-300:]}"
        return None

    def grabar_video(self, access_log_id):
        """Graba 4 segundos de video y lo sube al servidor en background."""
        def _record_and_upload():
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filepath = f"{VIDEO_DIR}/{access_log_id}_{timestamp}.mp4"

            try:
                error = self._record_clip(filepath)
                if error:
                    logger.error(error)
                    return

                # Upload to server
                logger.info(f"Subiendo video ({os.path.getsize(filepath)} bytes)...")
                with open(filepath, 'rb') as f:
                    response = requests.post(
                        f"{SERVER_URL}/api/access/video",
                        data={
                            'access_log_id': access_log_id,
                            'gym_token': GYM_TOKEN
                        },
                        files={'video': ('clip.mp4', f, 'video/mp4')},
                        timeout=30
                    )
                
                if response.status_code == 200:
                    logger.info("Video subido correctamente")
                else:
                    logger.error(f"Error al subir video: {response.status_code} {response.text[:100]}")
                
            except subprocess.TimeoutExpired:
                logger.error("Timeout grabando video")
            except Exception as e:
                logger.error(f"Error en grabacion: {e}")
            finally:
                # Clean up local file
                if os.path.exists(filepath):
                    os.remove(filepath)
        
        # Run in background thread to not block QR scanning
        thread = threading.Thread(target=_record_and_upload, daemon=True)
        thread.start()
    
    def validar_qr(self, qr_code, forced_direction="auto"):
        try:
            response = requests.post(
                f"{SERVER_URL}/api/access/validate",
                json={
                    "qr_code": qr_code,
                    "gym_token": GYM_TOKEN,
                    "direction": forced_direction,
                    "device_id": DEVICE_ID
                },
                timeout=10
            )
            return response.json()
        except Exception as e:
            logger.error(f"Error: {e}")
            return {"valid": False, "reason": "Error de conexion"}
    
    def procesar_qr(self, qr_code, forced_direction="auto"):
        if not qr_code:
            return
        
        with self._scan_lock:
            ahora = time.time()
            if ahora - self._last_scan.get(qr_code, 0) < DEBOUNCE_SEGUNDOS:
                logger.info(f"Doble lectura local ignorada ({forced_direction})")
                return
            self._last_scan = {k: v for k, v in self._last_scan.items() if ahora - v < DEBOUNCE_SEGUNDOS}
            self._last_scan[qr_code] = ahora
        
        logger.info(f"QR escaneado ({forced_direction}): {qr_code[:20]}...")
        resultado = self.validar_qr(qr_code, forced_direction)
        
        self.last_scan_at = datetime.now().isoformat(timespec='seconds')
        self.last_scan_result = (
            f"{resultado.get('member_name') or resultado.get('guest_name') or 'Socio'} - {resultado.get('direction', '')}"
            if resultado.get('valid') else f"DENEGADO: {resultado.get('reason', 'Desconocido')}"
        )
        
        if resultado.get('duplicate'):
            logger.info(f"Doble lectura ignorada por servidor: {resultado.get('member_name', '')}")
            return
        
        if resultado.get('valid'):
            direction = resultado.get('direction', forced_direction if forced_direction != 'auto' else 'entrada')
            
            if resultado.get('is_guest'):
                nombre = resultado.get('guest_name', 'Invitado')
                print(f"\n  INVITADO: {nombre}")
                print(f"   Invitado de: {resultado.get('invited_by', '')}\n")
            else:
                nombre = resultado.get('member_name', 'Socio')
                print(f"\n  BIENVENIDO: {nombre} ({direction})\n")
            
            self.abrir_torno(direction)
            
            # GRABAR VIDEO SOLO EN ENTRADAS
            if direction == 'entrada' and resultado.get('access_log_id'):
                self.grabar_video(resultado['access_log_id'])
        else:
            razon = resultado.get('reason', 'Desconocido')
            logger.warning(f"DENEGADO: {razon}")
            print(f"\n  ACCESO DENEGADO: {razon}\n")
    
    def _find_qr_reader_device(self):
        """Busca el primer dispositivo de entrada del lector QR USB (compatibilidad)."""
        devices = self._find_all_qr_readers()
        return devices[0] if devices else None

    def _find_all_qr_readers(self):
        """Busca TODOS los lectores QR USB conectados."""
        from evdev import InputDevice, list_devices
        found = []
        for dev_path in list_devices():
            try:
                d = InputDevice(dev_path)
                name_lower = d.name.lower()
                if 'qr' in name_lower or 'barcode' in name_lower or 'scanner' in name_lower or 'hid' in name_lower or 'keyboard' in name_lower:
                    if d.name != 'gpio-keys':
                        logger.info(f"Lector encontrado: {d.name} ({dev_path})")
                        found.append(d)
            except Exception:
                continue
        # Ordenar por path para que el orden sea estable entre reinicios
        found.sort(key=lambda dev: dev.path)
        return found

    def _read_qr_from_device(self, device):
        """Lee un QR completo del dispositivo USB hasta encontrar ENTER."""
        from evdev import categorize, ecodes, KeyEvent
        # Mapa keycodes -> caracteres
        keymap_lower = {
            'KEY_0': '0', 'KEY_1': '1', 'KEY_2': '2', 'KEY_3': '3', 'KEY_4': '4',
            'KEY_5': '5', 'KEY_6': '6', 'KEY_7': '7', 'KEY_8': '8', 'KEY_9': '9',
            'KEY_A': 'a', 'KEY_B': 'b', 'KEY_C': 'c', 'KEY_D': 'd', 'KEY_E': 'e',
            'KEY_F': 'f', 'KEY_G': 'g', 'KEY_H': 'h', 'KEY_I': 'i', 'KEY_J': 'j',
            'KEY_K': 'k', 'KEY_L': 'l', 'KEY_M': 'm', 'KEY_N': 'n', 'KEY_O': 'o',
            'KEY_P': 'p', 'KEY_Q': 'q', 'KEY_R': 'r', 'KEY_S': 's', 'KEY_T': 't',
            'KEY_U': 'u', 'KEY_V': 'v', 'KEY_W': 'w', 'KEY_X': 'x', 'KEY_Y': 'y',
            'KEY_Z': 'z',
            'KEY_MINUS': '-', 'KEY_DOT': '.', 'KEY_SLASH': '/', 'KEY_SEMICOLON': ';',
            'KEY_APOSTROPHE': "'", 'KEY_COMMA': ',', 'KEY_SPACE': ' ',
        }
        keymap_upper = {
            'KEY_0': ')', 'KEY_1': '!', 'KEY_2': '@', 'KEY_3': '#', 'KEY_4': '$',
            'KEY_5': '%', 'KEY_6': '^', 'KEY_7': '&', 'KEY_8': '*', 'KEY_9': '(',
            'KEY_A': 'A', 'KEY_B': 'B', 'KEY_C': 'C', 'KEY_D': 'D', 'KEY_E': 'E',
            'KEY_F': 'F', 'KEY_G': 'G', 'KEY_H': 'H', 'KEY_I': 'I', 'KEY_J': 'J',
            'KEY_K': 'K', 'KEY_L': 'L', 'KEY_M': 'M', 'KEY_N': 'N', 'KEY_O': 'O',
            'KEY_P': 'P', 'KEY_Q': 'Q', 'KEY_R': 'R', 'KEY_S': 'S', 'KEY_T': 'T',
            'KEY_U': 'U', 'KEY_V': 'V', 'KEY_W': 'W', 'KEY_X': 'X', 'KEY_Y': 'Y',
            'KEY_Z': 'Z',
        }
        buffer = ""
        shift_held = False
        # Solo intentar grab si aun no esta grabbed (evita warning en reinicios)
        if not getattr(device, '_gym24_grabbed', False):
            try:
                device.grab()
                device._gym24_grabbed = True
            except OSError as e:
                if e.errno != 16:  # Ignorar EBUSY (ya grabbed)
                    logger.warning(f"No se pudo grab del dispositivo: {e}")
            except Exception as e:
                logger.warning(f"No se pudo grab del dispositivo: {e}")

        for event in device.read_loop():
            if event.type == ecodes.EV_KEY:
                key_event = categorize(event)
                if key_event.keystate == KeyEvent.key_down:
                    if key_event.keycode in ('KEY_LEFTSHIFT', 'KEY_RIGHTSHIFT'):
                        shift_held = True
                    elif key_event.keycode == 'KEY_ENTER':
                        result = buffer.strip()
                        buffer = ""
                        if result:
                            return result
                    else:
                        key_str = key_event.keycode if isinstance(key_event.keycode, str) else key_event.keycode[0]
                        char_map = keymap_upper if shift_held else keymap_lower
                        if key_str in char_map:
                            buffer += char_map[key_str]
                elif key_event.keystate == KeyEvent.key_up:
                    if key_event.keycode in ('KEY_LEFTSHIFT', 'KEY_RIGHTSHIFT'):
                        shift_held = False
        return None

    def _reader_loop(self, device, forced_direction):
        """Loop dedicado a leer de un lector y procesar con direccion forzada."""
        logger.info(f"Thread iniciado: lector '{device.name}' -> {forced_direction.upper()}")
        try:
            while self.running:
                qr_code = self._read_qr_from_device(device)
                if qr_code:
                    self.procesar_qr(qr_code, forced_direction)
        except Exception as e:
            logger.error(f"Error en lector {device.name}: {e}")

    def run(self):
        # Detectar camara (env var o auto)
        active_video = VIDEO_DEVICE or _auto_detect_video_device()
        camera_status = active_video if active_video and os.path.exists(active_video) else "NO DETECTADA"

        print("\n" + "="*50)
        print("   GYM24 - SISTEMA DE CONTROL DE ACCESO")
        print("   + GRABACION DE VIDEO EN ENTRADAS")
        print("="*50)
        print(f"   Servidor: {SERVER_URL}")
        print(f"   Camara: {camera_status}")
        print(f"   Duracion clip: {VIDEO_DURATION}s")
        print("="*50)
        logger.info(f"Iniciando: Server={SERVER_URL} Device={DEVICE_ID} Camera={camera_status}")

        # Buscar TODOS los lectores conectados
        devices = []
        try:
            devices = self._find_all_qr_readers()
        except ImportError:
            logger.warning("evdev no instalado, usando modo stdin (manual)")

        if devices:
            # 1er lector (path mas bajo) = ENTRADA
            # 2do lector = SALIDA
            # Si hay solo 1, hace ENTRADA con direccion auto (servidor decide)
            assignments = []
            if len(devices) == 1:
                assignments.append((devices[0], "auto"))
                print(f"   Lector unico: {devices[0].name} -> ENTRADA/SALIDA auto")
            else:
                entrada_dev, salida_dev = (devices[1], devices[0]) if INVERTIR_LECTORES else (devices[0], devices[1])
                assignments.append((entrada_dev, "entrada"))
                assignments.append((salida_dev, "salida"))
                print(f"   Lector ENTRADA: {entrada_dev.name} ({entrada_dev.path})")
                print(f"   Lector SALIDA:  {salida_dev.name} ({salida_dev.path})")
                if len(devices) > 2:
                    print(f"   (Ignorando {len(devices) - 2} lectores adicionales)")
            print("="*50)
            print("   Esperando codigos QR...")
            print("="*50 + "\n")
            self.reader_names = [f"{d.path} -> {direc.upper()}" for d, direc in assignments]
            logger.info(f"Modo USB activo - {len(assignments)} lectores | INVERTIR_LECTORES={INVERTIR_LECTORES} INVERTIR_RELES={INVERTIR_RELES}")

            threads = []
            for device, direction in assignments:
                t = threading.Thread(
                    target=self._reader_loop,
                    args=(device, direction),
                    daemon=True
                )
                t.start()
                threads.append(t)

            try:
                while self.running:
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\nCerrando...")
                self.running = False
            finally:
                if GPIO_AVAILABLE:
                    GPIO.cleanup()
        else:
            # Fallback: leer de stdin (modo manual/desarrollo)
            print("   Lector USB no detectado - modo stdin manual")
            print("   Esperando codigos QR...")
            print("="*50 + "\n")
            logger.warning("Sin lector USB detectado - usando stdin")
            try:
                while self.running:
                    try:
                        qr_code = input().strip()
                        if qr_code:
                            self.procesar_qr(qr_code)
                    except EOFError:
                        logger.warning("stdin cerrado - esperando 30s")
                        time.sleep(30)
            except KeyboardInterrupt:
                print("\nCerrando...")
            finally:
                if GPIO_AVAILABLE:
                    GPIO.cleanup()


if __name__ == '__main__':
    if not GYM_TOKEN:
        print("Error: Configura GYM_TOKEN en .env")
        print("   Obten el token en: Panel Admin > Dispositivos")
        sys.exit(1)
    
    controller = AccessController()
    controller.run()

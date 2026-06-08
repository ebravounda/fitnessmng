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
VIDEO_DEVICE = os.environ.get('VIDEO_DEVICE', '/dev/video0')
VIDEO_DURATION = 4  # seconds
VIDEO_DIR = '/tmp/gym24_videos'

RELAY_ENTRADA = 17
RELAY_SALIDA = 27
TIEMPO_APERTURA = 3

os.makedirs(VIDEO_DIR, exist_ok=True)


class AccessController:
    def __init__(self):
        self.running = True
        
        if GPIO_AVAILABLE:
            GPIO.setmode(GPIO.BCM)
            GPIO.setwarnings(False)
            GPIO.setup(RELAY_ENTRADA, GPIO.OUT, initial=GPIO.HIGH)
            GPIO.setup(RELAY_SALIDA, GPIO.OUT, initial=GPIO.HIGH)
            logger.info("GPIO inicializado")
        
        # Ping thread
        self.ping_thread = threading.Thread(target=self._ping_loop, daemon=True)
        self.ping_thread.start()
    
    def _ping_loop(self):
        while self.running:
            try:
                requests.post(
                    f"{SERVER_URL}/api/devices/{DEVICE_ID}/ping",
                    params={"gym_token": GYM_TOKEN},
                    timeout=5
                )
            except:
                pass
            time.sleep(60)
    
    def abrir_torno(self, direccion):
        pin = RELAY_ENTRADA if direccion == 'entrada' else RELAY_SALIDA
        nombre = "ENTRADA" if direccion == 'entrada' else "SALIDA"
        logger.info(f"Abriendo torno {nombre}")
        if GPIO_AVAILABLE:
            GPIO.output(pin, GPIO.LOW)
            time.sleep(TIEMPO_APERTURA)
            GPIO.output(pin, GPIO.HIGH)
        else:
            time.sleep(TIEMPO_APERTURA)
        logger.info(f"Torno {nombre} cerrado")
    
    def grabar_video(self, access_log_id):
        """Graba 4 segundos de video y lo sube al servidor en background."""
        def _record_and_upload():
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filepath = f"{VIDEO_DIR}/{access_log_id}_{timestamp}.mp4"
            
            try:
                # Record 4 seconds using ffmpeg
                cmd = [
                    'ffmpeg', '-y',
                    '-f', 'v4l2',
                    '-video_size', '640x480',
                    '-framerate', '15',
                    '-i', VIDEO_DEVICE,
                    '-t', str(VIDEO_DURATION),
                    '-c:v', 'libx264',
                    '-preset', 'ultrafast',
                    '-crf', '28',
                    filepath
                ]
                logger.info(f"Grabando video: {filepath}")
                result = subprocess.run(cmd, capture_output=True, timeout=VIDEO_DURATION + 5)
                
                if result.returncode != 0:
                    logger.error(f"Error ffmpeg: {result.stderr.decode()[-200:]}")
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
                    logger.info(f"Video subido correctamente")
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
    
    def validar_qr(self, qr_code):
        try:
            response = requests.post(
                f"{SERVER_URL}/api/access/validate",
                json={
                    "qr_code": qr_code,
                    "gym_token": GYM_TOKEN,
                    "direction": "auto"
                },
                timeout=10
            )
            return response.json()
        except Exception as e:
            logger.error(f"Error: {e}")
            return {"valid": False, "reason": "Error de conexion"}
    
    def procesar_qr(self, qr_code):
        if not qr_code:
            return
        
        logger.info(f"QR escaneado: {qr_code[:20]}...")
        resultado = self.validar_qr(qr_code)
        
        if resultado.get('valid'):
            direction = resultado.get('direction', 'entrada')
            
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
        """Busca el dispositivo de entrada del lector QR USB."""
        import glob
        from evdev import InputDevice, list_devices
        for dev_path in list_devices():
            try:
                d = InputDevice(dev_path)
                # Buscamos un teclado USB (que es lo que es el lector QR)
                name_lower = d.name.lower()
                if 'qr' in name_lower or 'barcode' in name_lower or 'scanner' in name_lower or 'hid' in name_lower or 'keyboard' in name_lower:
                    if d.name != 'gpio-keys':  # Excluir teclas internas
                        logger.info(f"Lector encontrado: {d.name} ({dev_path})")
                        return d
            except Exception:
                continue
        return None

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
        try:
            device.grab()  # Bloqueo exclusivo del dispositivo
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

    def run(self):
        print("\n" + "="*50)
        print("   GYM24 - SISTEMA DE CONTROL DE ACCESO")
        print("   + GRABACION DE VIDEO EN ENTRADAS")
        print("="*50)
        print(f"   Servidor: {SERVER_URL}")
        print(f"   Camara: {VIDEO_DEVICE}")
        print(f"   Duracion clip: {VIDEO_DURATION}s")
        print("="*50)
        logger.info(f"Iniciando: Server={SERVER_URL} Device={DEVICE_ID}")

        # Intentar usar lector USB via evdev (modo servicio)
        device = None
        try:
            device = self._find_qr_reader_device()
        except ImportError:
            logger.warning("evdev no instalado, usando modo stdin (manual)")

        if device:
            print(f"   Lector USB: {device.name}")
            print("="*50)
            print("   Esperando codigos QR...")
            print("="*50 + "\n")
            logger.info("Modo USB activo - leyendo del lector QR")
            try:
                while self.running:
                    qr_code = self._read_qr_from_device(device)
                    if qr_code:
                        self.procesar_qr(qr_code)
            except KeyboardInterrupt:
                print("\nCerrando...")
            except Exception as e:
                logger.error(f"Error en loop USB: {e}")
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

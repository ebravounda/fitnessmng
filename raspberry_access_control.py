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
    
    def run(self):
        print("\n" + "="*50)
        print("   GYM24 - SISTEMA DE CONTROL DE ACCESO")
        print("   + GRABACION DE VIDEO EN ENTRADAS")
        print("="*50)
        print(f"   Servidor: {SERVER_URL}")
        print(f"   Camara: {VIDEO_DEVICE}")
        print(f"   Duracion clip: {VIDEO_DURATION}s")
        print("="*50)
        print("   Esperando codigos QR...")
        print("="*50 + "\n")
        
        try:
            while self.running:
                qr_code = input().strip()
                if qr_code:
                    self.procesar_qr(qr_code)
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

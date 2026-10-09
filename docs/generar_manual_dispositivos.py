#!/usr/bin/env python3
"""Genera DispositivosGym24.pdf (manual de aprovisionamiento de Raspberry Pi). Uso: python3 docs/generar_manual_dispositivos.py"""
import shutil
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Image, KeepTogether, PageBreak, Paragraph, Preformatted, SimpleDocTemplate, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "DispositivosGym24.pdf"
PUBLIC_COPY = ROOT / "frontend/public/downloads/DispositivosGym24.pdf"
LOGO = ROOT / "frontend/public/logo512.png"
VERSION = "2.0"
FECHA = "Junio 2026"
API = "https://api.gym24.app"

ORANGE = colors.HexColor("#FF6600")
DARK = colors.HexColor("#111111")
GREY = colors.HexColor("#F2F2F2")

ss = getSampleStyleSheet()
H1 = ParagraphStyle("H1", parent=ss["Heading1"], textColor=ORANGE, fontSize=18, spaceBefore=14, spaceAfter=8)
H2 = ParagraphStyle("H2", parent=ss["Heading2"], textColor=DARK, fontSize=13, spaceBefore=10, spaceAfter=4)
BODY = ParagraphStyle("B", parent=ss["BodyText"], fontSize=10, leading=14)
BULLET = ParagraphStyle("BL", parent=BODY, leftIndent=12, bulletIndent=2)
CODE = ParagraphStyle("C", fontName="Courier-Bold", fontSize=8.3, leading=11, textColor=colors.white)
NOTE = ParagraphStyle("N", parent=BODY, textColor=colors.HexColor("#7A3300"))
NEW = ParagraphStyle("NEW", parent=BODY, textColor=colors.HexColor("#0B6B3A"))

story = []


def h1(t):
    story.append(Paragraph(t, H1))


def h2(t):
    story.append(Paragraph(t, H2))


def p(t, style=BODY):
    story.append(Paragraph(t, style))


def bullets(items):
    for it in items:
        story.append(Paragraph(it, BULLET, bulletText="•"))


def code(t):
    block = Table([[Preformatted(t.strip("\n"), CODE)]], colWidths=[170 * mm])
    block.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), DARK),
        ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(KeepTogether([block, Spacer(1, 4)]))


def box(t, style=NOTE, bg="#FFF1E6", border=ORANGE):
    b = Table([[Paragraph(t, style)]], colWidths=[170 * mm])
    b.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(bg)),
        ("LINEBEFORE", (0, 0), (0, -1), 3, border),
        ("LEFTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(b)
    story.append(Spacer(1, 6))


def table(rows, widths):
    data = [[Paragraph(f"<b>{c}</b>" if i == 0 else c, BODY) for c in r] for i, r in enumerate(rows)]
    t = Table(data, colWidths=[w * mm for w in widths], repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ORANGE), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, GREY]),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#DDDDDD")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(t)
    story.append(Spacer(1, 6))


def cover():
    story.append(Spacer(1, 45 * mm))
    if LOGO.exists():
        story.append(Image(str(LOGO), width=32 * mm, height=32 * mm))
    story.append(Spacer(1, 10 * mm))
    story.append(Paragraph("Dispositivos Gym24", ParagraphStyle("T", fontName="Helvetica-Bold", fontSize=30, leading=36, alignment=TA_CENTER, textColor=ORANGE)))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("Guía de aprovisionamiento de Raspberry Pi para control de acceso", ParagraphStyle("S", parent=BODY, fontSize=13, leading=17, alignment=TA_CENTER, textColor=colors.HexColor("#555555"))))
    story.append(Spacer(1, 25 * mm))
    meta = [["Documento", "DispositivosGym24"], ["Versión", VERSION], ["Fecha", FECHA],
            ["Sistema", "Raspberry Pi 4/5 + Pi OS Lite 64-bit"], ["Script Pi", "raspberry_access_control.py v2.1"], ["Backend", API.replace("https://", "")]]
    t = Table(meta, colWidths=[40 * mm, 80 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), ORANGE), ("TEXTCOLOR", (0, 0), (0, -1), colors.white),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"), ("BACKGROUND", (1, 0), (1, -1), GREY),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.white), ("FONTSIZE", (0, 0), (-1, -1), 10),
    ]))
    story.append(t)
    story.append(PageBreak())


def toc():
    h1("Contenido")
    items = [
        "Novedades de la versión 2.0", "1. Material necesario", "2. Preparar microSD", "3. Conectar hardware (GPIO + USB)",
        "4. Primer arranque y SSH", "5. Actualizar sistema", "6. Crear dispositivo en el panel Gym24",
        "7. Instalar script Gym24 en la Pi", "8. Configurar archivo .env", "9. Verificar cámara USB",
        "10. Crear servicio systemd", "11. Limpieza automática de logs", "12. Verificación final",
        "13. Monitor RPi y comandos remotos", "14. Protección contra doble lectura",
        "15. Actualizar una Raspberry ya instalada", "16. Resolución de problemas", "17. Comandos útiles del día a día",
        "18. Anexo: configuración multi-lector", "Reglas importantes",
    ]
    for it in items:
        p(it)
    story.append(Spacer(1, 8))
    h1("Novedades de la versión 2.0")
    bullets([
        "<b>Monitor RPi</b> (Super Admin): la Raspberry envía cada 20 s su IP local, IP pública, temperatura, CPU, RAM, disco, "
        "tiempo encendida, WiFi, lectores QR, cámara y último escaneo.",
        "<b>Comandos remotos</b> desde el panel: abrir torno de entrada/salida, grabar video de prueba, reiniciar servicio y reiniciar la Raspberry.",
        "<b>Anti-doble lectura</b>: un mismo QR leído dos veces seguidas (o por los dos lectores) ya no genera una \"Salida\" fantasma.",
        "<b>Descarga del script desde el servidor Gym24</b> (ya no hace falta acceso a GitHub).",
        "Nueva variable opcional <font face='Courier'>GYMACCESS_SERVICE_NAME</font> y procedimiento de actualización con copia de seguridad.",
    ])
    story.append(PageBreak())


def s1_to_s6():
    h1("1. Material necesario")
    table([
        ["Componente", "Modelo recomendado", "Precio aprox."],
        ["Raspberry Pi 4 (2GB+) o Pi 5", "Pi 4 Model B / Pi 5", "~50€"],
        ["MicroSD 32GB clase A1", "SanDisk Ultra", "~10€"],
        ["Fuente alimentación oficial Pi", "5V 3A USB-C", "~10€"],
        ["Lector QR USB", "MEGAHUNT / Honeywell HF600 / Netum NT-1228BL", "~30-50€"],
        ["(Opcional) 2º lector QR USB", "mismo modelo (entrada + salida)", "~30-50€"],
        ["Cámara USB", "Logitech C270 o similar", "~25€"],
        ["Módulo relé 2 canales 5V", "SainSmart 2CH", "~5€"],
        ["Cables Dupont F-F", "Pack genérico", "~3€"],
        ["Caja para Pi (opcional)", "Argon Neo o similar", "~15€"],
        ["", "<b>TOTAL APROX.</b>", "<b>~180-230€</b>"],
    ], [60, 80, 30])

    h1("2. Preparar microSD")
    p("En tu PC (no en la Pi todavía):")
    bullets(["Descargar <b>Raspberry Pi Imager</b> desde raspberrypi.com/software/", "Insertar la microSD en el PC",
             "Sistema operativo: <b>Raspberry Pi OS Lite (64-bit)</b>", "Almacenamiento: tu microSD"])
    h2("Configuración avanzada (icono engranaje)")
    bullets(["Hostname: <font face='Courier'>gym24-NOMBREGYM-XX</font> (ej. coslada). Aparecerá en el Monitor RPi.",
             "Habilitar SSH con contraseña", "Usuario: <font face='Courier'>pi</font>",
             "WiFi: nombre + contraseña de la red del gimnasio (o usar cable Ethernet, recomendado)",
             "Zona horaria: Europe/Madrid", "Teclado: es"])
    p("Clic en <b>Guardar</b> -> <b>Escribir</b> y esperar ~5 min.")

    h1("3. Conectar hardware (GPIO + USB)")
    box("<b>IMPORTANTE:</b> apaga la Pi antes de conectar cables GPIO.")
    h2("Esquema GPIO (módulo relé)")
    table([
        ["Pin físico Pi", "GPIO", "Conecta a", "Función"],
        ["Pin 2 (5V)", "-", "VCC del módulo relé", "Alimentación"],
        ["Pin 6 (GND)", "-", "GND del módulo relé", "Tierra"],
        ["Pin 32", "GPIO 12", "IN1 del módulo relé", "Relé ENTRADA"],
        ["Pin 36", "GPIO 16", "IN2 del módulo relé", "Relé SALIDA"],
    ], [35, 25, 60, 50])
    h2("Conexiones del relé al torno (por cada canal)")
    bullets(["COM (común) -> un cable del torno", "NO (Normally Open) -> 12V/24V del torno", "NC (Normally Closed) -> no se usa"])
    p("El torno necesita su propia alimentación (12V o 24V típico). El relé solo hace de interruptor.")
    h2("Conexiones USB")
    bullets(["Lector QR ENTRADA -> puerto USB", "Lector QR SALIDA (opcional) -> otro puerto USB",
             "Cámara USB -> otro puerto USB (graba 4 s en cada entrada)"])

    h1("4. Primer arranque y SSH")
    bullets(["Inserta la microSD y conecta la Pi a la red", "Enciende la Pi (fuente USB-C)",
             "Busca la IP en el router del gimnasio o con <font face='Courier'>arp -a</font> desde tu PC",
             "Conéctate desde tu PC:"])
    code("ssh pi@<IP-DE-LA-PI>")
    box("Una vez instalado el script (paso 7), la IP local aparecerá automáticamente en <b>Super Admin -> Monitor RPi</b>, "
        "así no tendrás que buscarla en el router.", NEW, "#E8F7EE", colors.HexColor("#0B6B3A"))

    h1("5. Actualizar sistema")
    code("sudo apt update && sudo apt upgrade -y\nsudo apt install -y python3-pip python3-venv ffmpeg nano v4l-utils curl")

    h1("6. Crear dispositivo en el panel Gym24")
    p("Antes de configurar la Pi necesitas el <b>DEVICE_ID</b> y el <b>GYM_TOKEN</b>:")
    bullets(["Entra a https://gym24.app/admin como Super Admin", "Menú lateral -> <b>Dispositivos</b> -> <b>+ Nuevo Dispositivo</b>",
             "Selecciona el gimnasio y pon un nombre (ej. Torno Coslada)",
             "Al guardar obtendrás <b>DEVICE_ID</b> (UUID) y <b>GYM_TOKEN</b>. Guárdalos para el paso 8."])
    box("Cada Raspberry necesita su propio dispositivo (DEVICE_ID). El GYM_TOKEN debe ser el del mismo gimnasio al que pertenece el "
        "dispositivo: si no coinciden, el servidor rechaza la conexión y la Pi aparece OFFLINE.")


def s7_to_s12():
    h1("7. Instalar script Gym24 en la Pi")
    code("sudo mkdir -p /opt/gym24\ncd /opt/gym24")
    p("Descargar la última versión del script <b>desde el servidor Gym24</b>:")
    code(f"sudo curl -fsSL {API}/api/download/raspberry-py \\\n  -o /opt/gym24/raspberry_access_control.py\n\n"
         "# Comprobar la version (debe mostrar 2.1 o superior)\ngrep \"SOFTWARE_VERSION =\" /opt/gym24/raspberry_access_control.py")
    p("Crear el entorno virtual e instalar dependencias:")
    code("sudo python3 -m venv /opt/gym24/venv\nsudo /opt/gym24/venv/bin/pip install requests python-dotenv RPi.GPIO evdev")

    h1("8. Configurar archivo .env")
    code("sudo nano /opt/gym24/.env")
    p("Pega este contenido (sustituye los valores en mayúscula):")
    code(f"GYMACCESS_SERVER_URL={API}\nGYMACCESS_GYM_TOKEN=TU_TOKEN_AQUI\nGYMACCESS_DEVICE_ID=TU_DEVICE_ID_AQUI\nVIDEO_DEVICE=/dev/video0\n"
         "# Opcional: solo si el servicio NO se llama gym24-access\n# GYMACCESS_SERVICE_NAME=gym24-access")
    p("Guardar con Ctrl+O, Enter, Ctrl+X y proteger el archivo:")
    code("sudo chmod 600 /opt/gym24/.env")

    h1("9. Verificar cámara USB")
    code("ls /dev/video*\nffmpeg -f v4l2 -i /dev/video0 -t 4 -y /tmp/test.mp4\nls -la /tmp/test.mp4")
    p("Si el archivo pesa más de 100 KB la cámara funciona. Si tu cámara aparece en otra ruta (ej. /dev/video2), cambia "
      "<font face='Courier'>VIDEO_DEVICE</font> en el .env. Más adelante puedes repetir esta prueba desde el panel con el botón <b>Video prueba</b>.")

    h1("10. Crear servicio systemd (auto-arranque)")
    box("El servicio debe llamarse <b>gym24-access</b> y ejecutarse como <b>root</b>: así funcionan los comandos remotos "
        "\"Reiniciar servicio\" y \"Reiniciar RPi\" desde el panel.")
    code("""sudo tee /etc/systemd/system/gym24-access.service > /dev/null << 'EOF'
[Unit]
Description=Gym24 Access Control
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/gym24
ExecStart=/opt/gym24/venv/bin/python3 /opt/gym24/raspberry_access_control.py
Restart=always
RestartSec=10
StandardInput=null
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF""")
    code("sudo systemctl daemon-reload\nsudo systemctl enable gym24-access\nsudo systemctl start gym24-access\nsudo systemctl status gym24-access")
    p("Verifica que dice: <b>Active: active (running)</b>")

    h1("11. Limpieza automática de logs")
    code("""sudo tee /etc/cron.d/gym24-logs-cleanup > /dev/null << 'EOF'
# Gym24 - Limpiar logs los domingos a las 00:00
0 0 * * 0 root journalctl --vacuum-time=1s --unit=gym24-access > /dev/null 2>&1
0 0 * * 0 root rm -f /var/log/gym24-access.log
0 0 * * 0 root rm -rf /tmp/gym24_videos/*
EOF""")
    code("""sudo mkdir -p /etc/systemd/journald.conf.d/
sudo tee /etc/systemd/journald.conf.d/gym24.conf > /dev/null << 'EOF'
[Journal]
SystemMaxUse=100M
SystemMaxFileSize=20M
MaxRetentionSec=7day
EOF
sudo systemctl restart systemd-journald""")

    h1("12. Verificación final")
    h2("a) Logs del servicio")
    code("sudo journalctl -u gym24-access -n 30 --no-pager")
    p("Debes ver algo así:")
    code("GPIO inicializado\nIniciando: Server=https://api.gym24.app Device=e72f3b90-... Camera=/dev/video0\n"
         "Lector encontrado: MEGAHUNT Megahunt HID FS Keyboard (/dev/input/event2)\n"
         "Modo USB activo - 2 lectores\nThread iniciado: lector 'MEGAHUNT...' -> ENTRADA\nThread iniciado: lector 'MEGAHUNT...' -> SALIDA")
    h2("b) Monitor RPi (antes de 30 segundos)")
    bullets(["Entra como Super Admin -> <b>Monitor RPi</b>",
             "La tarjeta del dispositivo debe mostrar <b>EN LINEA</b>, IP local, temperatura, lectores QR detectados, cámara y <b>Versión 2.1</b>",
             "Si aparece el aviso \"script antiguo\", el script no es la versión 2.1: repite el paso 7"])
    h2("c) Prueba de funcionamiento desde el panel")
    table([
        ["Botón", "Resultado esperado (en menos de 20 s)"],
        ["Abrir entrada", "Click del relé de ENTRADA, el torno abre 3 s. Historial: OK"],
        ["Abrir salida", "Click del relé de SALIDA. Historial: OK"],
        ["Video prueba", "Historial: \"Video de 4s grabado OK (xxx KB)\""],
    ], [40, 130])
    h2("d) Prueba con un socio")
    bullets(["Escanea el QR de un socio con membresía activa -> el torno abre", "En Admin -> Accesos aparece una sola marca con su video"])


def s13_to_s15():
    h1("13. Monitor RPi y comandos remotos")
    p("Menú <b>Monitor RPi</b> (solo Super Admin). La página se refresca cada 10 s y la Raspberry envía datos cada 20 s. "
      "Si no se recibe señal durante 2 minutos, la tarjeta pasa a <b>OFFLINE</b> en rojo.")
    h2("Datos que se muestran")
    table([
        ["Dato", "Descripción", "Se marca en rojo si..."],
        ["IP local", "IP de la Pi en la red del gimnasio (para SSH)", "-"],
        ["IP pública", "IP de salida a Internet del gimnasio", "-"],
        ["Temp", "Temperatura de la CPU", "> 70 °C (revisar ventilación/caja)"],
        ["CPU / RAM / Disco", "Uso en %", "> 90 %"],
        ["Encendida", "Tiempo desde el último reinicio", "-"],
        ["WiFi", "Calidad de señal (0-70). \"Cable / -\" si usa Ethernet", "< 25"],
        ["Lectores QR", "Lectores USB detectados", "Ninguno"],
        ["Cámara", "Dispositivo de video detectado", "No detectada"],
        ["Último escaneo", "Último socio escaneado y dirección, o motivo de denegación", "-"],
        ["Versión", "Versión del script de la Pi", "\"Antigua\" = actualizar (paso 15)"],
    ], [32, 88, 50])
    h2("Comandos disponibles")
    table([
        ["Comando", "Qué hace", "Confirmación"],
        ["Abrir entrada", "Activa el relé de ENTRADA (GPIO 12) 3 s", "No"],
        ["Abrir salida", "Activa el relé de SALIDA (GPIO 16) 3 s", "No"],
        ["Video prueba", "Graba 4 s con la cámara y reporta el tamaño (no se guarda)", "No"],
        ["Reiniciar servicio", "Reinicia gym24-access (~10 s sin control de acceso)", "Sí"],
        ["Reiniciar RPi", "Reinicia la Raspberry completa (~1 min sin control de acceso)", "Sí"],
    ], [35, 105, 30])
    p("Cada comando aparece en el historial de la tarjeta: <b>Pendiente</b> (esperando a la Pi) -> <b>Ejecutando</b> -> "
      "<b>OK</b> o <b>Error</b> con el mensaje. Si la Pi está offline, el comando espera hasta 10 minutos; después pasa a <b>Expirado</b> "
      "y no se ejecuta (así una Pi que vuelve tarde no abre el torno por sorpresa).")

    h1("14. Protección contra doble lectura")
    p("Algunos lectores envían el mismo QR dos veces o los dos lectores leen el móvil a la vez. Antes esto registraba "
      "\"Entrada\" y una \"Salida\" fantasma. Ahora hay dos filtros:")
    bullets(["<b>En la Raspberry</b>: el mismo QR leído en menos de 3 s (por cualquiera de los lectores) se ignora.",
             "<b>En el servidor</b>: si el mismo socio vuelve a marcar en menos de 10 s, no se crea un nuevo registro ni se abre otra vez el torno."])
    p("Además, la primera marca de un socio nuevo siempre se registra como <b>Entrada</b>.")

    h1("15. Actualizar una Raspberry ya instalada")
    p("Para pasar una Pi existente a la última versión (no hace falta tocar el .env):")
    code("# 1. Ver donde esta el script y el nombre del servicio\nsudo find / -name \"*access_control*.py\" -not -path \"*/proc/*\" 2>/dev/null\n"
         "systemctl list-units --type=service --all | grep -iE \"gym|access\"")
    p("Si el script está en <font face='Courier'>/opt/gym24/</font> y el servicio es <font face='Courier'>gym24-access</font> (instalación estándar):")
    code(f"# 2. Copia de seguridad\nsudo cp /opt/gym24/raspberry_access_control.py \\\n  /opt/gym24/raspberry_access_control.py.bak\n\n"
         f"# 3. Descargar la nueva version\nsudo curl -fsSL {API}/api/download/raspberry-py \\\n  -o /opt/gym24/raspberry_access_control.py\n\n"
         "# 4. Comprobar version (2.1 o superior)\ngrep \"SOFTWARE_VERSION =\" /opt/gym24/raspberry_access_control.py\n\n"
         "# 5. Reiniciar y revisar\nsudo systemctl restart gym24-access\nsleep 5\nsudo journalctl -u gym24-access -n 20 --no-pager")
    box("<b>Volver a la versión anterior</b> si algo falla:<br/>"
        "<font face='Courier'>sudo cp /opt/gym24/raspberry_access_control.py.bak /opt/gym24/raspberry_access_control.py<br/>sudo systemctl restart gym24-access</font>")
    p("Si el servicio tiene otro nombre (instalaciones antiguas, ej. <font face='Courier'>gymaccess</font>), añade al .env "
      "<font face='Courier'>GYMACCESS_SERVICE_NAME=nombre</font> para que funcione \"Reiniciar servicio\" desde el panel.")


def s16_to_end():
    h1("16. Resolución de problemas")
    problems = [
        ("La Pi aparece OFFLINE en Monitor RPi",
         "curl https://api.gym24.app/api/\nsudo cat /opt/gym24/.env\nsudo journalctl -u gym24-access -n 50 --no-pager",
         "Comprueba Internet, que GYM_TOKEN y DEVICE_ID son correctos y que el dispositivo pertenece al mismo gimnasio que el token."),
        ("Aviso \"script antiguo\" / Versión: Antigua", None, "La Pi ejecuta un script anterior a 2.1. Sigue el paso 15."),
        ("Los comandos quedan en Pendiente o Expirado", "sudo systemctl status gym24-access",
         "La Pi no está enviando señal. Si está OFFLINE, revisa red y servicio. Los comandos expiran a los 10 min."),
        ("\"Reiniciar servicio\" no hace nada", "systemctl list-units --type=service --all | grep -iE \"gym|access\"",
         "El servicio tiene otro nombre: configúralo con GYMACCESS_SERVICE_NAME en el .env y reinicia el servicio."),
        ("El lector QR no responde", "lsusb\nsudo journalctl -u gym24-access | grep 'Lector'",
         "En Monitor RPi revisa \"Lectores QR\". Si dice Ninguno, cambia de puerto USB y reinicia el servicio."),
        ("El torno no abre físicamente", """sudo /opt/gym24/venv/bin/python3 -c "
import RPi.GPIO as GPIO, time
GPIO.setmode(GPIO.BCM); GPIO.setwarnings(False)
GPIO.setup(12, GPIO.OUT, initial=GPIO.HIGH)
GPIO.output(12, GPIO.LOW); time.sleep(3); GPIO.output(12, GPIO.HIGH)
GPIO.cleanup()"
""", "Primero detén el servicio (sudo systemctl stop gym24-access). Debe oírse el click del relé. "
            "También puedes usar el botón \"Abrir entrada\" del panel."),
        ("No graba video", "ls /dev/video*",
         "Usa el botón \"Video prueba\": el historial mostrará el error exacto (cámara no encontrada, error ffmpeg...). "
         "Ajusta VIDEO_DEVICE en el .env si la ruta es otra."),
        ("Temperatura en rojo (> 70 °C)", None, "Mejora la ventilación, usa caja con disipador o ventilador, evita lugares cerrados o al sol."),
    ]
    for title, cmd, text in problems:
        h2(title)
        if cmd:
            code(cmd)
        p(text)

    h1("17. Comandos útiles del día a día")
    table([
        ["Acción", "Comando"],
        ["Estado del servicio", "sudo systemctl status gym24-access"],
        ["Reiniciar servicio", "sudo systemctl restart gym24-access"],
        ["Detener / iniciar", "sudo systemctl stop gym24-access / start gym24-access"],
        ["Logs en vivo (Ctrl+C sale)", "sudo journalctl -u gym24-access -f"],
        ["Últimas 50 líneas", "sudo journalctl -u gym24-access -n 50 --no-pager"],
        ["Ver IP de la Pi", "hostname -I (o en Monitor RPi)"],
        ["Versión del script", "grep \"SOFTWARE_VERSION =\" /opt/gym24/raspberry_access_control.py"],
        ["Lectores detectados", "sudo journalctl -u gym24-access | grep \"Lector encontrado\""],
        ["Espacio disco / memoria", "df -h / free -h"],
        ["Editar configuración", "sudo nano /opt/gym24/.env"],
        ["Reiniciar / apagar la Pi", "sudo reboot / sudo shutdown -h now"],
    ], [55, 115])

    h1("18. Anexo: configuración multi-lector (entrada + salida)")
    bullets(["1er lector detectado (ruta /dev/input/eventX más baja) -> lector de <b>ENTRADA</b>",
             "2º lector -> lector de <b>SALIDA</b>", "Un solo lector -> modo auto (el servidor alterna entrada/salida)",
             "Lectores adicionales -> se ignoran"])
    p("Si los lectores quedan invertidos (el de entrada abre la salida), intercambia sus puertos USB y reinicia:")
    code("sudo systemctl restart gym24-access\nsudo journalctl -u gym24-access -n 20 --no-pager | grep 'Thread iniciado'")
    p("Comprueba en el log qué lector quedó como ENTRADA y cuál como SALIDA, y verifica con los botones \"Abrir entrada\" / \"Abrir salida\" del panel que cada relé corresponde a su torno.")

    h1("Reglas importantes")
    bullets([
        "NUNCA borres /opt/gym24/.env (contiene el token único del gimnasio).",
        "NUNCA cambies DEVICE_ID ni GYM_TOKEN de una Pi en funcionamiento: el panel pierde la sincronización.",
        "NUNCA conectes/desconectes cables GPIO con la Pi encendida.",
        "Para añadir OTRA Pi (otro torno): crea un nuevo dispositivo en el panel (nuevo DEVICE_ID) y repite todos los pasos.",
        "Antes de actualizar el script haz siempre la copia de seguridad (.bak) del paso 15.",
        "Usa \"Reiniciar RPi\" solo fuera de horas punta: el acceso queda parado ~1 minuto.",
        "Si cambia la red WiFi del gimnasio: sudo raspi-config.",
    ])
    story.append(Spacer(1, 10))
    p("Gym24 - Sistema de Control de Acceso | Frontend: https://gym24.app | Backend: https://api.gym24.app | Soporte: info@gym24.es")


def on_page(canvas, doc):
    if doc.page == 1:
        return
    canvas.saveState()
    canvas.setFillColor(ORANGE)
    canvas.rect(0, A4[1] - 8 * mm, A4[0], 8 * mm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.drawString(15 * mm, A4[1] - 5.5 * mm, f"Dispositivos Gym24 - v{VERSION}")
    canvas.setFillColor(colors.grey)
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(A4[0] - 15 * mm, 10 * mm, f"Página {doc.page}")
    canvas.restoreState()


def build():
    cover()
    toc()
    s1_to_s6()
    s7_to_s12()
    s13_to_s15()
    s16_to_end()
    doc = SimpleDocTemplate(str(OUT), pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm, topMargin=16 * mm, bottomMargin=18 * mm,
                            title="DispositivosGym24 - Guía de aprovisionamiento", author="Gym24")
    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    shutil.copy(OUT, PUBLIC_COPY)
    print(f"OK -> {OUT} y {PUBLIC_COPY}")


if __name__ == "__main__":
    build()

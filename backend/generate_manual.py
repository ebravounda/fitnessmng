#!/usr/bin/env python3
"""
Generador del Manual de Super Administrador - Gym24
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import HexColor, black, white
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, ListFlowable, ListItem, HRFlowable
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.pdfgen import canvas
import os

# Colors
ORANGE = HexColor('#FF6600')
DARK_BG = HexColor('#1a1a1a')
LIGHT_GRAY = HexColor('#f5f5f5')
MEDIUM_GRAY = HexColor('#666666')
DARK_GRAY = HexColor('#333333')

OUTPUT_PATH = '/app/frontend/public/downloads/manual_superadmin_gym24.pdf'
os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

def create_manual():
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2.5*cm,
        bottomMargin=2*cm
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    styles.add(ParagraphStyle(
        name='ManualTitle',
        fontName='Helvetica-Bold',
        fontSize=28,
        textColor=ORANGE,
        alignment=TA_CENTER,
        spaceAfter=6*mm
    ))
    
    styles.add(ParagraphStyle(
        name='ManualSubtitle',
        fontName='Helvetica',
        fontSize=14,
        textColor=MEDIUM_GRAY,
        alignment=TA_CENTER,
        spaceAfter=15*mm
    ))
    
    styles.add(ParagraphStyle(
        name='ChapterTitle',
        fontName='Helvetica-Bold',
        fontSize=20,
        textColor=ORANGE,
        spaceBefore=10*mm,
        spaceAfter=6*mm
    ))
    
    styles.add(ParagraphStyle(
        name='SectionTitle',
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=DARK_GRAY,
        spaceBefore=8*mm,
        spaceAfter=4*mm
    ))
    
    styles.add(ParagraphStyle(
        name='BodyText2',
        fontName='Helvetica',
        fontSize=11,
        textColor=black,
        spaceBefore=2*mm,
        spaceAfter=2*mm,
        leading=16,
        alignment=TA_JUSTIFY
    ))
    
    styles.add(ParagraphStyle(
        name='StepText',
        fontName='Helvetica',
        fontSize=11,
        textColor=black,
        spaceBefore=1*mm,
        spaceAfter=1*mm,
        leading=16,
        leftIndent=10*mm
    ))
    
    styles.add(ParagraphStyle(
        name='ImportantNote',
        fontName='Helvetica-Bold',
        fontSize=11,
        textColor=ORANGE,
        spaceBefore=4*mm,
        spaceAfter=4*mm,
        leftIndent=5*mm,
        borderWidth=1,
        borderColor=ORANGE,
        borderPadding=5
    ))
    
    styles.add(ParagraphStyle(
        name='TipText',
        fontName='Helvetica-Oblique',
        fontSize=10,
        textColor=MEDIUM_GRAY,
        spaceBefore=2*mm,
        spaceAfter=4*mm,
        leftIndent=10*mm
    ))

    elements = []
    
    # ==================== COVER PAGE ====================
    elements.append(Spacer(1, 40*mm))
    elements.append(Paragraph("GYM24", styles['ManualTitle']))
    elements.append(Paragraph("Manual del Super Administrador", styles['ManualSubtitle']))
    elements.append(Spacer(1, 10*mm))
    elements.append(Paragraph("Guia completa para gestionar la plataforma", ParagraphStyle(
        name='CoverDesc', fontName='Helvetica', fontSize=12, textColor=MEDIUM_GRAY, alignment=TA_CENTER
    )))
    elements.append(Spacer(1, 20*mm))
    
    # Info box
    cover_data = [
        ['Plataforma:', 'https://gym24.app'],
        ['Panel Admin:', 'https://gym24.app/admin/login'],
        ['API:', 'https://api.gym24.app'],
        ['Email Super Admin:', 'info@gym24.es'],
    ]
    cover_table = Table(cover_data, colWidths=[5*cm, 10*cm])
    cover_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('TEXTCOLOR', (0, 0), (0, -1), DARK_GRAY),
        ('TEXTCOLOR', (1, 0), (1, -1), ORANGE),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ]))
    elements.append(cover_table)
    
    elements.append(Spacer(1, 30*mm))
    elements.append(Paragraph("Version 1.0 - Abril 2026", ParagraphStyle(
        name='Version', fontName='Helvetica', fontSize=10, textColor=MEDIUM_GRAY, alignment=TA_CENTER
    )))
    
    elements.append(PageBreak())
    
    # ==================== TABLE OF CONTENTS ====================
    elements.append(Paragraph("Indice de Contenidos", styles['ChapterTitle']))
    elements.append(Spacer(1, 5*mm))
    
    toc_items = [
        ("1. Acceder al Panel de Administracion", "3"),
        ("2. Vista General del Panel (Dashboard)", "4"),
        ("3. Crear un Nuevo Negocio (Gimnasio/Piscina)", "5"),
        ("4. Crear Cuentas de Administrador para Negocios", "7"),
        ("5. Crear y Gestionar Socios", "8"),
        ("6. Crear Planes y Membresias", "10"),
        ("7. Registrar Pagos", "12"),
        ("8. Control de Acceso con QR", "13"),
        ("9. Configurar Dispositivos Raspberry Pi", "14"),
        ("10. Videos de Acceso (Grabaciones)", "15"),
        ("11. Clases y Horarios", "16"),
        ("12. Configuracion del Negocio", "17"),
        ("13. Reportes y Estadisticas", "18"),
        ("14. Crear Cuenta Demo para Clientes", "19"),
        ("15. Preguntas Frecuentes", "20"),
    ]
    
    for item, page in toc_items:
        elements.append(Paragraph(f"{item} {'.' * (60 - len(item))} {page}", ParagraphStyle(
            name='TOCItem', fontName='Helvetica', fontSize=11, textColor=DARK_GRAY, spaceBefore=2*mm, spaceAfter=2*mm
        )))
    
    elements.append(PageBreak())
    
    # ==================== CHAPTER 1: LOGIN ====================
    elements.append(Paragraph("1. Acceder al Panel de Administracion", styles['ChapterTitle']))
    elements.append(HRFlowable(width="100%", thickness=1, color=ORANGE))
    elements.append(Spacer(1, 5*mm))
    
    elements.append(Paragraph("Para acceder al panel de administracion de Gym24, siga estos pasos:", styles['BodyText2']))
    elements.append(Spacer(1, 3*mm))
    
    steps = [
        "<b>Paso 1:</b> Abra su navegador de internet (Google Chrome, Safari, Firefox).",
        "<b>Paso 2:</b> En la barra de direcciones, escriba: <b>gym24.app/admin/login</b>",
        "<b>Paso 3:</b> Vera una pantalla con el logo de Gym24 y un formulario de acceso.",
        "<b>Paso 4:</b> En el campo <b>Email</b>, escriba su correo electronico de administrador.",
        "<b>Paso 5:</b> En el campo <b>Contrasena</b>, escriba su contrasena.",
        "<b>Paso 6:</b> Haga clic en el boton naranja <b>\"Iniciar Sesion\"</b>.",
        "<b>Paso 7:</b> Si los datos son correctos, sera redirigido al Dashboard (pantalla principal).",
    ]
    for step in steps:
        elements.append(Paragraph(step, styles['StepText']))
    
    elements.append(Spacer(1, 5*mm))
    elements.append(Paragraph("IMPORTANTE: Si olvida su contrasena, contacte al soporte tecnico.", styles['ImportantNote']))
    
    elements.append(Spacer(1, 3*mm))
    elements.append(Paragraph("Credenciales por defecto del Super Administrador:", styles['SectionTitle']))
    
    cred_data = [
        ['Email:', 'info@gym24.es'],
        ['Contrasena:', 'admin123'],
    ]
    cred_table = Table(cred_data, colWidths=[4*cm, 8*cm])
    cred_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Courier'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('BACKGROUND', (1, 0), (1, -1), LIGHT_GRAY),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (1, 0), (1, -1), 10),
    ]))
    elements.append(cred_table)
    
    elements.append(Paragraph("Consejo: Cambie la contrasena por defecto desde Configuracion > Cambiar Contrasena.", styles['TipText']))
    
    elements.append(PageBreak())
    
    # ==================== CHAPTER 2: DASHBOARD ====================
    elements.append(Paragraph("2. Vista General del Panel (Dashboard)", styles['ChapterTitle']))
    elements.append(HRFlowable(width="100%", thickness=1, color=ORANGE))
    elements.append(Spacer(1, 5*mm))
    
    elements.append(Paragraph("Al iniciar sesion, vera el Dashboard con informacion resumida:", styles['BodyText2']))
    elements.append(Spacer(1, 3*mm))
    
    elements.append(Paragraph("<b>Las 4 tarjetas principales muestran:</b>", styles['BodyText2']))
    dashboard_items = [
        "<b>Socios Activos:</b> Numero total de socios con membresia vigente.",
        "<b>Accesos Hoy:</b> Cuantas personas han entrado hoy al negocio.",
        "<b>Membresias Activas:</b> Total de membresias que no han vencido.",
        "<b>Ingresos del Mes:</b> Dinero cobrado durante el mes actual.",
    ]
    for item in dashboard_items:
        elements.append(Paragraph(f"  * {item}", styles['StepText']))
    
    elements.append(Spacer(1, 5*mm))
    elements.append(Paragraph("<b>Menu lateral (Sidebar):</b>", styles['SectionTitle']))
    elements.append(Paragraph("En el lado izquierdo de la pantalla vera un menu con las siguientes opciones:", styles['BodyText2']))
    
    menu_items = [
        ["Dashboard", "Pantalla principal con resumen"],
        ["Socios", "Crear, editar y gestionar socios"],
        ["Planes", "Crear tarifas y planes de membresia"],
        ["Accesos", "Ver historial de entradas y salidas"],
        ["Clases", "Gestionar clases y horarios"],
        ["Negocios", "Crear y administrar gimnasios/piscinas (Solo Super Admin)"],
        ["Dispositivos", "Gestionar Raspberry Pi de control de acceso"],
        ["Monitor RPi", "Ver estado de dispositivos en tiempo real"],
        ["Contabilidad", "Ingresos, gastos y reportes"],
        ["Analiticas", "Estadisticas detalladas"],
        ["Configuracion", "Ajustes del sistema"],
    ]
    
    menu_table = Table([['Opcion', 'Descripcion']] + menu_items, colWidths=[4.5*cm, 11*cm])
    menu_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 1), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, 0), ORANGE),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('BACKGROUND', (0, 1), (-1, -1), LIGHT_GRAY),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#dddddd')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(Spacer(1, 3*mm))
    elements.append(menu_table)
    
    elements.append(PageBreak())
    
    # ==================== CHAPTER 3: CREATE BUSINESS ====================
    elements.append(Paragraph("3. Crear un Nuevo Negocio", styles['ChapterTitle']))
    elements.append(HRFlowable(width="100%", thickness=1, color=ORANGE))
    elements.append(Spacer(1, 5*mm))
    
    elements.append(Paragraph("Como Super Administrador, usted puede crear multiples negocios. Cada negocio funciona de forma independiente con sus propios socios, planes y accesos.", styles['BodyText2']))
    elements.append(Spacer(1, 3*mm))
    
    elements.append(Paragraph("<b>Tipos de negocio disponibles:</b>", styles['SectionTitle']))
    
    business_types = [
        ["Gimnasio", "Gym con socios, membresias, entrenadores, clases"],
        ["Piscina", "Piscina publica o privada con abonos, aforo, socorristas"],
        ["Condominio", "Residencial con control de acceso para residentes"],
        ["Hotel", "Control de huespedes con reservas y check-in/out"],
    ]
    
    bt_table = Table([['Tipo', 'Descripcion']] + business_types, colWidths=[4*cm, 11.5*cm])
    bt_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, 0), ORANGE),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('BACKGROUND', (0, 1), (-1, -1), LIGHT_GRAY),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#dddddd')),
    ]))
    elements.append(bt_table)
    
    elements.append(Spacer(1, 5*mm))
    elements.append(Paragraph("<b>Pasos para crear un negocio:</b>", styles['SectionTitle']))
    
    steps = [
        "<b>Paso 1:</b> En el menu lateral, haga clic en <b>\"Negocios\"</b>.",
        "<b>Paso 2:</b> Haga clic en el boton <b>\"+ Nuevo Negocio\"</b> (arriba a la derecha).",
        "<b>Paso 3:</b> Complete el formulario con los datos del negocio:",
        "    - <b>Nombre:</b> Nombre del gimnasio o piscina (ej: \"Fitness Zone Madrid\")",
        "    - <b>Tipo:</b> Seleccione Gimnasio, Piscina, Condominio u Hotel",
        "    - <b>Direccion:</b> Direccion fisica del negocio",
        "    - <b>Telefono:</b> Numero de contacto",
        "    - <b>Email:</b> Correo del negocio",
        "    - <b>Color principal:</b> Color de la marca (naranja por defecto)",
        "    - <b>Capacidad maxima:</b> Numero maximo de socios permitidos",
        "<b>Paso 4:</b> En la seccion <b>\"Administrador del Negocio\"</b>, cree las credenciales:",
        "    - <b>Nombre del admin:</b> Nombre de la persona que administrara",
        "    - <b>Email del admin:</b> Correo con el que iniciara sesion",
        "    - <b>Contrasena:</b> Contrasena para el administrador",
        "<b>Paso 5:</b> Haga clic en <b>\"Crear Negocio\"</b>.",
        "<b>Paso 6:</b> El negocio aparecera en la lista. El admin ya puede acceder con sus credenciales.",
    ]
    for step in steps:
        elements.append(Paragraph(step, styles['StepText']))
    
    elements.append(Spacer(1, 5*mm))
    elements.append(Paragraph("NOTA: Cada negocio es completamente independiente. Los socios de un gimnasio NO pueden acceder a otro.", styles['ImportantNote']))
    
    elements.append(PageBreak())
    
    # ==================== CHAPTER 4: ADMIN ACCOUNTS ====================
    elements.append(Paragraph("4. Crear Cuentas de Administrador", styles['ChapterTitle']))
    elements.append(HRFlowable(width="100%", thickness=1, color=ORANGE))
    elements.append(Spacer(1, 5*mm))
    
    elements.append(Paragraph("Existen diferentes niveles de administracion:", styles['BodyText2']))
    
    roles_data = [
        ['Rol', 'Permisos', 'Quien lo usa'],
        ['Super Admin', 'Todo el sistema, todos los negocios', 'Usted (propietario de Gym24)'],
        ['Gym Admin', 'Todo dentro de SU negocio', 'Dueno del gimnasio/piscina'],
        ['Gym Staff', 'Permisos limitados (ver socios, registrar pagos)', 'Recepcionista, empleado'],
    ]
    
    roles_table = Table(roles_data, colWidths=[3.5*cm, 6.5*cm, 5.5*cm])
    roles_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, 0), ORANGE),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('BACKGROUND', (0, 1), (-1, -1), LIGHT_GRAY),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#dddddd')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(roles_table)
    
    elements.append(Spacer(1, 5*mm))
    elements.append(Paragraph("El Gym Admin se crea automaticamente al crear el negocio (Capitulo 3). Para crear personal adicional, el Gym Admin puede hacerlo desde su panel en Configuracion > Personal.", styles['BodyText2']))
    
    elements.append(PageBreak())
    
    # ==================== CHAPTER 5: MEMBERS ====================
    elements.append(Paragraph("5. Crear y Gestionar Socios", styles['ChapterTitle']))
    elements.append(HRFlowable(width="100%", thickness=1, color=ORANGE))
    elements.append(Spacer(1, 5*mm))
    
    elements.append(Paragraph("Los socios son las personas que acceden al negocio (gimnasio, piscina, etc.).", styles['BodyText2']))
    
    elements.append(Paragraph("<b>Crear un nuevo socio:</b>", styles['SectionTitle']))
    steps = [
        "<b>Paso 1:</b> En el menu lateral, haga clic en <b>\"Socios\"</b>.",
        "<b>Paso 2:</b> Haga clic en el boton <b>\"+ Nuevo Socio\"</b>.",
        "<b>Paso 3:</b> Complete el formulario:",
        "    - <b>Nombre completo:</b> Nombre y apellidos del socio",
        "    - <b>Email:</b> Correo electronico (opcional pero recomendado)",
        "    - <b>Telefono:</b> Numero de contacto",
        "    - <b>Negocio:</b> Seleccione a cual negocio pertenecera",
        "<b>Paso 4:</b> Haga clic en <b>\"Crear Socio\"</b>.",
        "<b>Paso 5:</b> El sistema generara automaticamente un <b>codigo de 6 caracteres</b> (ej: ABC123).",
        "<b>Paso 6:</b> Comunique este codigo al socio. Lo usara para acceder a su app.",
    ]
    for step in steps:
        elements.append(Paragraph(step, styles['StepText']))
    
    elements.append(Spacer(1, 5*mm))
    elements.append(Paragraph("<b>Acciones disponibles por socio:</b>", styles['SectionTitle']))
    
    actions = [
        "  * <b>Editar:</b> Modificar nombre, email, telefono",
        "  * <b>Asignar Membresia:</b> Asignar un plan al socio",
        "  * <b>Registrar Pago:</b> Registrar un cobro manual",
        "  * <b>Suspender:</b> Bloquear temporalmente el acceso",
        "  * <b>Reactivar:</b> Desbloquear un socio suspendido",
        "  * <b>Videos de Acceso:</b> Ver grabaciones de cuando entro al negocio",
        "  * <b>QR Estatico/Dinamico:</b> Cambiar el tipo de QR del socio",
        "  * <b>Subir Foto:</b> Agregar foto de perfil",
        "  * <b>Eliminar:</b> Eliminar permanentemente al socio",
    ]
    for action in actions:
        elements.append(Paragraph(action, styles['StepText']))
    
    elements.append(Spacer(1, 5*mm))
    elements.append(Paragraph("<b>Estados de un socio:</b>", styles['SectionTitle']))
    
    status_data = [
        ['Estado', 'Significado', 'Puede acceder?'],
        ['Activo', 'Todo en orden, membresia vigente', 'SI'],
        ['Pendiente', 'Registrado pero sin pago', 'NO'],
        ['Suspendido', 'Bloqueado por admin o por falta de pago', 'NO'],
        ['Bloqueado', 'Bloqueado permanentemente', 'NO'],
    ]
    
    status_table = Table(status_data, colWidths=[3*cm, 7*cm, 4*cm])
    status_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, 0), ORANGE),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('BACKGROUND', (0, 1), (-1, -1), LIGHT_GRAY),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#dddddd')),
    ]))
    elements.append(status_table)
    
    elements.append(PageBreak())
    
    # ==================== CHAPTER 6: PLANS ====================
    elements.append(Paragraph("6. Crear Planes y Membresias", styles['ChapterTitle']))
    elements.append(HRFlowable(width="100%", thickness=1, color=ORANGE))
    elements.append(Spacer(1, 5*mm))
    
    elements.append(Paragraph("Los planes definen cuanto tiempo y a que precio los socios pueden acceder al negocio.", styles['BodyText2']))
    
    elements.append(Paragraph("<b>Crear un nuevo plan:</b>", styles['SectionTitle']))
    steps = [
        "<b>Paso 1:</b> En el menu lateral, haga clic en <b>\"Planes\"</b>.",
        "<b>Paso 2:</b> Haga clic en <b>\"+ Nuevo Plan\"</b>.",
        "<b>Paso 3:</b> Complete los datos:",
        "    - <b>Nombre del plan:</b> Ej: \"Mensual Basico\", \"Trimestral\", \"Acceso Diario\"",
        "    - <b>Precio:</b> Cuanto cuesta (en euros)",
        "    - <b>Duracion:</b> Numero de dias que dura (30, 90, 365, etc.)",
        "    - <b>Descripcion:</b> Que incluye el plan (opcional)",
        "<b>Paso 4:</b> Haga clic en <b>\"Crear Plan\"</b>.",
    ]
    for step in steps:
        elements.append(Paragraph(step, styles['StepText']))
    
    elements.append(Spacer(1, 5*mm))
    elements.append(Paragraph("<b>Ejemplos de planes:</b>", styles['SectionTitle']))
    
    plans_data = [
        ['Plan', 'Precio', 'Duracion'],
        ['Acceso Diario', '5 EUR', '1 dia'],
        ['Semanal', '15 EUR', '7 dias'],
        ['Mensual Basico', '30 EUR', '30 dias'],
        ['Mensual Premium', '50 EUR', '30 dias'],
        ['Trimestral', '75 EUR', '90 dias'],
        ['Anual', '250 EUR', '365 dias'],
    ]
    
    plans_table = Table(plans_data, colWidths=[5.5*cm, 3.5*cm, 4*cm])
    plans_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, 0), ORANGE),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('BACKGROUND', (0, 1), (-1, -1), LIGHT_GRAY),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#dddddd')),
    ]))
    elements.append(plans_table)
    
    elements.append(Spacer(1, 5*mm))
    elements.append(Paragraph("<b>Asignar un plan a un socio:</b>", styles['SectionTitle']))
    steps = [
        "<b>Paso 1:</b> Vaya a <b>\"Socios\"</b> y busque al socio.",
        "<b>Paso 2:</b> Haga clic en los tres puntos (menu) del socio.",
        "<b>Paso 3:</b> Seleccione <b>\"Asignar Membresia\"</b>.",
        "<b>Paso 4:</b> Elija el plan deseado de la lista.",
        "<b>Paso 5:</b> Confirme. La fecha de vencimiento se calculara automaticamente.",
    ]
    for step in steps:
        elements.append(Paragraph(step, styles['StepText']))
    
    elements.append(Paragraph("Consejo: Para piscinas, cree un plan \"Acceso Diario\" de 1 dia para visitantes ocasionales.", styles['TipText']))
    
    elements.append(PageBreak())
    
    # ==================== CHAPTER 7: PAYMENTS ====================
    elements.append(Paragraph("7. Registrar Pagos", styles['ChapterTitle']))
    elements.append(HRFlowable(width="100%", thickness=1, color=ORANGE))
    elements.append(Spacer(1, 5*mm))
    
    elements.append(Paragraph("Cada vez que un socio paga, debe registrarse en el sistema para llevar la contabilidad.", styles['BodyText2']))
    
    elements.append(Paragraph("<b>Registrar un pago:</b>", styles['SectionTitle']))
    steps = [
        "<b>Paso 1:</b> Vaya a <b>\"Socios\"</b> y busque al socio que pago.",
        "<b>Paso 2:</b> Haga clic en los tres puntos (menu).",
        "<b>Paso 3:</b> Seleccione <b>\"Registrar Pago\"</b>.",
        "<b>Paso 4:</b> Complete los datos:",
        "    - <b>Plan:</b> Seleccione el plan que esta pagando",
        "    - <b>Metodo de pago:</b> Efectivo, Tarjeta, Transferencia, etc.",
        "    - <b>Notas:</b> Cualquier observacion (opcional)",
        "<b>Paso 5:</b> Haga clic en <b>\"Registrar Pago\"</b>.",
        "<b>Paso 6:</b> El pago se registra y la membresia se renueva automaticamente.",
    ]
    for step in steps:
        elements.append(Paragraph(step, styles['StepText']))
    
    elements.append(Spacer(1, 5*mm))
    elements.append(Paragraph("IMPORTANTE: Si el socio ya tiene membresia vigente y paga, la nueva membresia se suma a partir de la fecha de vencimiento actual (no se pierde tiempo).", styles['ImportantNote']))
    
    elements.append(PageBreak())
    
    # ==================== CHAPTER 8: QR ACCESS ====================
    elements.append(Paragraph("8. Control de Acceso con QR", styles['ChapterTitle']))
    elements.append(HRFlowable(width="100%", thickness=1, color=ORANGE))
    elements.append(Spacer(1, 5*mm))
    
    elements.append(Paragraph("El sistema funciona con codigos QR que los socios muestran al entrar.", styles['BodyText2']))
    
    elements.append(Paragraph("<b>Como funciona para el socio:</b>", styles['SectionTitle']))
    steps = [
        "<b>1.</b> El socio abre la app en su movil: <b>gym24.app/app/login</b>",
        "<b>2.</b> Ingresa su codigo de 6 caracteres (ej: ABC123)",
        "<b>3.</b> Ve su QR en la pantalla principal",
        "<b>4.</b> Muestra el QR al lector de la Raspberry Pi en el torno",
        "<b>5.</b> Si todo esta correcto, el torno se abre y puede entrar",
    ]
    for step in steps:
        elements.append(Paragraph(step, styles['StepText']))
    
    elements.append(Spacer(1, 5*mm))
    elements.append(Paragraph("<b>Tipos de QR:</b>", styles['SectionTitle']))
    
    qr_data = [
        ['Tipo', 'Descripcion', 'Seguridad'],
        ['Dinamico', 'Cambia cada 30 segundos', 'MUY ALTA - No se puede copiar'],
        ['Estatico', 'No cambia nunca', 'MEDIA - Se puede compartir'],
    ]
    qr_table = Table(qr_data, colWidths=[3*cm, 6*cm, 6*cm])
    qr_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, 0), ORANGE),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('BACKGROUND', (0, 1), (-1, -1), LIGHT_GRAY),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#dddddd')),
    ]))
    elements.append(qr_table)
    
    elements.append(Paragraph("Consejo: Use QR dinamico para maxima seguridad. El QR estatico es util para socios que no tienen buena conexion a internet.", styles['TipText']))
    
    elements.append(PageBreak())
    
    # ==================== CHAPTER 9: RASPBERRY PI ====================
    elements.append(Paragraph("9. Configurar Dispositivos Raspberry Pi", styles['ChapterTitle']))
    elements.append(HRFlowable(width="100%", thickness=1, color=ORANGE))
    elements.append(Spacer(1, 5*mm))
    
    elements.append(Paragraph("La Raspberry Pi es el dispositivo que lee los QR y controla el torno de acceso.", styles['BodyText2']))
    
    elements.append(Paragraph("<b>Registrar un nuevo dispositivo:</b>", styles['SectionTitle']))
    steps = [
        "<b>Paso 1:</b> Vaya a <b>\"Dispositivos\"</b> en el menu.",
        "<b>Paso 2:</b> Haga clic en <b>\"+ Nuevo Dispositivo\"</b>.",
        "<b>Paso 3:</b> Asigne un nombre (ej: \"Torno Entrada Principal\").",
        "<b>Paso 4:</b> Seleccione el negocio al que pertenece.",
        "<b>Paso 5:</b> El sistema generara un <b>Token</b> unico.",
        "<b>Paso 6:</b> Este Token se configura en la Raspberry Pi.",
    ]
    for step in steps:
        elements.append(Paragraph(step, styles['StepText']))
    
    elements.append(Spacer(1, 5*mm))
    elements.append(Paragraph("<b>Verificar estado de dispositivos:</b>", styles['SectionTitle']))
    elements.append(Paragraph("Vaya a <b>\"Monitor RPi\"</b> para ver:", styles['BodyText2']))
    steps = [
        "  * <b>Estado:</b> EN LINEA (verde) u OFFLINE (rojo)",
        "  * <b>IP Publica:</b> Direccion de internet del dispositivo",
        "  * <b>IP Local:</b> Direccion en la red interna",
    ]
    for step in steps:
        elements.append(Paragraph(step, styles['StepText']))
    
    elements.append(PageBreak())
    
    # ==================== CHAPTER 10: VIDEOS ====================
    elements.append(Paragraph("10. Videos de Acceso (Grabaciones)", styles['ChapterTitle']))
    elements.append(HRFlowable(width="100%", thickness=1, color=ORANGE))
    elements.append(Spacer(1, 5*mm))
    
    elements.append(Paragraph("Cada vez que un socio entra al negocio escaneando su QR, la camara de la Raspberry Pi graba un video de 4 segundos.", styles['BodyText2']))
    
    elements.append(Paragraph("<b>Ver videos desde el historial de accesos:</b>", styles['SectionTitle']))
    steps = [
        "<b>Paso 1:</b> Vaya a <b>\"Accesos\"</b> en el menu.",
        "<b>Paso 2:</b> Los registros que tienen video mostraran un boton naranja <b>\"Video\"</b>.",
        "<b>Paso 3:</b> Haga clic en <b>\"Video\"</b> para reproducir la grabacion.",
    ]
    for step in steps:
        elements.append(Paragraph(step, styles['StepText']))
    
    elements.append(Spacer(1, 5*mm))
    elements.append(Paragraph("<b>Ver videos de un socio especifico:</b>", styles['SectionTitle']))
    steps = [
        "<b>Paso 1:</b> Vaya a <b>\"Socios\"</b>.",
        "<b>Paso 2:</b> Busque al socio.",
        "<b>Paso 3:</b> Haga clic en los tres puntos (menu).",
        "<b>Paso 4:</b> Seleccione <b>\"Videos de Acceso\"</b>.",
        "<b>Paso 5:</b> Vera la lista de todas sus grabaciones con fecha y hora.",
        "<b>Paso 6:</b> Haga clic en <b>\"Ver\"</b> para reproducir cualquier video.",
    ]
    for step in steps:
        elements.append(Paragraph(step, styles['StepText']))
    
    elements.append(Spacer(1, 5*mm))
    elements.append(Paragraph("NOTA: Los videos se eliminan automaticamente despues de 30 dias para ahorrar espacio en el servidor.", styles['ImportantNote']))
    
    elements.append(PageBreak())
    
    # ==================== CHAPTER 11: CLASSES ====================
    elements.append(Paragraph("11. Clases y Horarios", styles['ChapterTitle']))
    elements.append(HRFlowable(width="100%", thickness=1, color=ORANGE))
    elements.append(Spacer(1, 5*mm))
    
    elements.append(Paragraph("Puede crear clases (spinning, yoga, natacion, etc.) con horarios y capacidad limitada.", styles['BodyText2']))
    
    elements.append(Paragraph("<b>Crear una clase:</b>", styles['SectionTitle']))
    steps = [
        "<b>Paso 1:</b> Vaya a <b>\"Clases\"</b> en el menu.",
        "<b>Paso 2:</b> Haga clic en <b>\"+ Nueva Clase\"</b>.",
        "<b>Paso 3:</b> Complete: nombre, instructor, dia, hora, duracion, capacidad.",
        "<b>Paso 4:</b> Los socios podran ver y reservar la clase desde su app.",
    ]
    for step in steps:
        elements.append(Paragraph(step, styles['StepText']))
    
    elements.append(PageBreak())
    
    # ==================== CHAPTER 12: SETTINGS ====================
    elements.append(Paragraph("12. Configuracion del Negocio", styles['ChapterTitle']))
    elements.append(HRFlowable(width="100%", thickness=1, color=ORANGE))
    elements.append(Spacer(1, 5*mm))
    
    elements.append(Paragraph("Desde <b>\"Configuracion\"</b> puede personalizar:", styles['BodyText2']))
    
    settings_items = [
        "  * <b>Datos del negocio:</b> Nombre, direccion, telefono, logo",
        "  * <b>Color principal:</b> Personalizar el color de la app para los socios",
        "  * <b>Logo:</b> Subir el logo del negocio (aparecera en la app)",
        "  * <b>QR:</b> Elegir entre QR dinamico o estatico por defecto",
        "  * <b>Acceso automatico:</b> Configurar si detecta entrada/salida automaticamente",
        "  * <b>Personal:</b> Gestionar empleados con permisos limitados",
        "  * <b>Notificaciones:</b> Configurar alertas por email",
    ]
    for item in settings_items:
        elements.append(Paragraph(item, styles['StepText']))
    
    elements.append(PageBreak())
    
    # ==================== CHAPTER 13: REPORTS ====================
    elements.append(Paragraph("13. Reportes y Estadisticas", styles['ChapterTitle']))
    elements.append(HRFlowable(width="100%", thickness=1, color=ORANGE))
    elements.append(Spacer(1, 5*mm))
    
    elements.append(Paragraph("El sistema ofrece reportes detallados:", styles['BodyText2']))
    
    elements.append(Paragraph("<b>Contabilidad:</b>", styles['SectionTitle']))
    items = [
        "  * Ingresos por dia, semana y mes",
        "  * Pagos pendientes",
        "  * Metodos de pago utilizados",
        "  * Exportar a Excel",
    ]
    for item in items:
        elements.append(Paragraph(item, styles['StepText']))
    
    elements.append(Paragraph("<b>Analiticas:</b>", styles['SectionTitle']))
    items = [
        "  * Horas pico de acceso",
        "  * Retencion de socios",
        "  * Membresias activas vs vencidas",
        "  * Comparativa mensual",
    ]
    for item in items:
        elements.append(Paragraph(item, styles['StepText']))
    
    elements.append(Paragraph("<b>Exportar datos:</b>", styles['SectionTitle']))
    elements.append(Paragraph("En la seccion de <b>\"Accesos\"</b>, haga clic en <b>\"Exportar Excel\"</b> para descargar todos los registros en formato Excel.", styles['BodyText2']))
    
    elements.append(PageBreak())
    
    # ==================== CHAPTER 14: DEMO ACCOUNT ====================
    elements.append(Paragraph("14. Crear Cuenta Demo para Clientes", styles['ChapterTitle']))
    elements.append(HRFlowable(width="100%", thickness=1, color=ORANGE))
    elements.append(Spacer(1, 5*mm))
    
    elements.append(Paragraph("Cuando un cliente potencial quiere probar el sistema antes de contratar, puede crearle una cuenta demo.", styles['BodyText2']))
    
    elements.append(Paragraph("<b>Pasos para crear una demo:</b>", styles['SectionTitle']))
    steps = [
        "<b>Paso 1:</b> Cree un nuevo negocio (ver Capitulo 3) con estos datos:",
        "    - Nombre: \"DEMO - [Nombre del cliente]\"",
        "    - Tipo: El que el cliente necesite (Gimnasio, Piscina, etc.)",
        "    - Capacidad: 10 (limitada para demo)",
        "<b>Paso 2:</b> Cree 2-3 socios de prueba para que el cliente vea como funciona.",
        "<b>Paso 3:</b> Cree 2-3 planes de ejemplo.",
        "<b>Paso 4:</b> Asigne membresias a los socios de prueba.",
        "<b>Paso 5:</b> Envie las credenciales de admin al cliente para que explore.",
    ]
    for step in steps:
        elements.append(Paragraph(step, styles['StepText']))
    
    elements.append(Spacer(1, 5*mm))
    elements.append(Paragraph("<b>Datos que debe enviar al cliente:</b>", styles['SectionTitle']))
    
    demo_data = [
        ['Concepto', 'Ejemplo'],
        ['URL Panel Admin', 'gym24.app/admin/login'],
        ['Email Admin', 'demo@clientenuevo.com'],
        ['Contrasena Admin', '(la que usted definio)'],
        ['URL App Socios', 'gym24.app/app/login'],
        ['Codigo de socio demo', 'ABC123 (el que se genero)'],
    ]
    demo_table = Table(demo_data, colWidths=[5*cm, 10*cm])
    demo_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, 0), ORANGE),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('BACKGROUND', (0, 1), (-1, -1), LIGHT_GRAY),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#dddddd')),
    ]))
    elements.append(demo_table)
    
    elements.append(Spacer(1, 5*mm))
    elements.append(Paragraph("Consejo: Una vez que el cliente contrate, puede convertir el negocio demo en produccion simplemente eliminando los datos de prueba y cambiando el nombre.", styles['TipText']))
    
    elements.append(PageBreak())
    
    # ==================== CHAPTER 15: FAQ ====================
    elements.append(Paragraph("15. Preguntas Frecuentes", styles['ChapterTitle']))
    elements.append(HRFlowable(width="100%", thickness=1, color=ORANGE))
    elements.append(Spacer(1, 5*mm))
    
    faqs = [
        ("Un socio perdio su codigo, que hago?", 
         "Vaya a Socios, busque al socio por nombre y vera su codigo. Comuniqueselo nuevamente."),
        ("Un socio no puede entrar con el QR, que puede ser?",
         "Verifique: 1) Que tenga membresia vigente. 2) Que no este suspendido. 3) Que la Raspberry Pi este EN LINEA (Monitor RPi)."),
        ("Como veo cuanto dinero he cobrado este mes?",
         "Vaya a Dashboard - la tarjeta \"Ingresos del Mes\" muestra el total. Para mas detalle vaya a Contabilidad."),
        ("Puedo usar el sistema sin Raspberry Pi?",
         "Si, los socios pueden usar su QR desde el movil y usted puede registrar accesos manualmente. La Raspberry Pi es para automatizar el torno."),
        ("Como elimino un negocio demo?",
         "Vaya a Negocios, busque el demo y haga clic en Eliminar. Se borraran todos sus socios y datos."),
        ("Los socios pueden registrarse solos?",
         "Si, existe un link de registro publico. Vaya a Configuracion > Registro Publico para activarlo."),
        ("Que pasa si un socio comparte su QR con otra persona?",
         "Con QR dinamico es imposible compartir porque cambia cada 30 segundos. Con QR estatico, puede revisar los Videos de Acceso para verificar la identidad."),
        ("Como actualizo la plataforma?",
         "Contacte al soporte tecnico. Las actualizaciones se hacen desde el servidor."),
    ]
    
    for question, answer in faqs:
        elements.append(Paragraph(f"<b>P: {question}</b>", styles['BodyText2']))
        elements.append(Paragraph(f"R: {answer}", styles['StepText']))
        elements.append(Spacer(1, 3*mm))
    
    elements.append(Spacer(1, 10*mm))
    elements.append(HRFlowable(width="100%", thickness=2, color=ORANGE))
    elements.append(Spacer(1, 5*mm))
    elements.append(Paragraph("Soporte Tecnico: info@gym24.es", ParagraphStyle(
        name='Footer', fontName='Helvetica-Bold', fontSize=12, textColor=ORANGE, alignment=TA_CENTER
    )))
    elements.append(Paragraph("gym24.app", ParagraphStyle(
        name='Footer2', fontName='Helvetica', fontSize=11, textColor=MEDIUM_GRAY, alignment=TA_CENTER
    )))
    
    # Build PDF
    doc.build(elements)
    print(f"Manual generado: {OUTPUT_PATH}")
    print(f"Tamano: {os.path.getsize(OUTPUT_PATH) / 1024:.1f} KB")

if __name__ == '__main__':
    create_manual()

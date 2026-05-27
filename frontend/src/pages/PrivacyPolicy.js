import React from "react";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-400 mb-8 text-sm font-medium"
          data-testid="privacy-back-link"
        >
          ← Volver a Gym24
        </Link>

        <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
          Política de Privacidad
        </h1>
        <p className="text-zinc-500 text-sm mb-10">Última actualización: 25 de mayo de 2026</p>

        <div className="space-y-8 text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introducción</h2>
            <p>
              En <strong className="text-orange-500">Gym24</strong> nos tomamos la privacidad
              muy en serio. Esta política explica qué datos recopilamos, cómo los usamos
              y los derechos que tienes sobre ellos. Cumplimos con el Reglamento General
              de Protección de Datos (RGPD) de la Unión Europea.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Datos que recopilamos</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Datos de cuenta:</strong> nombre, email, teléfono, fecha de nacimiento.</li>
              <li><strong>Datos del gimnasio:</strong> historial de accesos, clases reservadas, rutinas asignadas.</li>
              <li><strong>Datos biométricos opcionales:</strong> identificador RFID si tu gimnasio lo usa.</li>
              <li><strong>Imágenes:</strong> foto de perfil (opcional) y videos de 4 segundos al entrar al gimnasio (control de acceso, retención 30 días).</li>
              <li><strong>Datos de uso:</strong> dispositivo, sistema operativo, IP (solo para seguridad).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Finalidad del tratamiento</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Gestionar tu acceso al gimnasio mediante QR o RFID.</li>
              <li>Mostrarte tus rutinas, clases y membresía.</li>
              <li>Procesar pagos y renovaciones (si aplica).</li>
              <li>Enviar notificaciones relacionadas con tu cuenta.</li>
              <li>Cumplir con obligaciones legales.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Base legal</h2>
            <p>
              Tratamos tus datos en base a: (a) el contrato de membresía con tu gimnasio,
              (b) tu consentimiento expreso para datos opcionales como la foto, y (c) el
              interés legítimo en la seguridad del acceso (videos de 4s).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Compartición de datos</h2>
            <p>
              No vendemos tus datos. Los compartimos únicamente con:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-2">
              <li>Tu gimnasio (administradores autorizados).</li>
              <li>Procesadores de pago (Redsys) si pagas online.</li>
              <li>Autoridades cuando la ley lo exija.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Retención</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Datos personales: mientras seas miembro activo + 4 años por obligación fiscal.</li>
              <li>Videos de acceso: <strong>30 días</strong>, después se eliminan automáticamente.</li>
              <li>Logs de seguridad: 1 año.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Tus derechos</h2>
            <p>Tienes derecho a:</p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-2">
              <li><strong>Acceso:</strong> solicitar una copia de tus datos.</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos.</li>
              <li><strong>Supresión:</strong> eliminar tu cuenta y datos asociados.</li>
              <li><strong>Portabilidad:</strong> recibir tus datos en formato JSON.</li>
              <li><strong>Oposición:</strong> oponerte a tratamientos basados en interés legítimo.</li>
              <li><strong>Reclamación:</strong> presentar queja ante la AEPD (www.aepd.es).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Seguridad</h2>
            <p>
              Aplicamos medidas técnicas y organizativas: cifrado en tránsito (HTTPS),
              contraseñas con bcrypt, tokens JWT con expiración, backups cifrados,
              bloqueo automático de IPs tras intentos fallidos, y acceso por roles a
              los datos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Menores</h2>
            <p>
              Gym24 no está dirigido a menores de 14 años. Para usuarios entre 14 y 18
              años se requiere consentimiento del tutor legal, gestionado por el gimnasio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Cookies</h2>
            <p>
              Usamos únicamente cookies técnicas necesarias para el funcionamiento de
              la aplicación (sesión, preferencias). No usamos cookies de tracking
              publicitario ni de terceros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Cambios en esta política</h2>
            <p>
              Podemos actualizar esta política. Te notificaremos los cambios importantes
              por email o mediante un aviso destacado en la app. La fecha de "última
              actualización" siempre indicará la versión vigente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Contacto</h2>
            <p>
              Para ejercer tus derechos o resolver dudas, contáctanos en:
            </p>
            <p className="mt-2">
              📧 <a href="mailto:info@gym24.es" className="text-orange-500 hover:text-orange-400">info@gym24.es</a>
            </p>
            <p className="mt-1">
              🌐 <a href="https://gym24.app" className="text-orange-500 hover:text-orange-400">gym24.app</a>
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-zinc-800 text-center text-zinc-500 text-sm">
          © 2026 Gym24. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
}

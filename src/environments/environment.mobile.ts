/**
 * Configuración para Apps Móviles (iOS/Android con Capacitor)
 *
 * IMPORTANTE: En móvil, la app corre desde file:// por lo que necesita
 * una URL absoluta al backend. No puede usar rutas relativas como '/api'
 *
 * ⚠️ ACTUALIZA ESTO CADA VEZ QUE COMPILAS PARA MÓVIL
 */

// 🔧 OPCIÓN 1: Para desarrollo local (RECOMENDADO)
// 1. Abre terminal y corre: npm run server
// 2. En otra terminal: npm install -g ngrok
// 3. Ejecuta: ngrok http 3333
// 4. Copia la URL HTTPS (ejemplo: https://a1b2c3d4.ngrok-free.app)
// 5. Reemplaza aquí con: 'https://a1b2c3d4.ngrok-free.app/api'

// 🔧 OPCIÓN 2: Para producción
// Reemplaza con la URL real de tu backend:
// - 'https://api.tudominio.com/api'
// - 'https://tu-backend.onrender.com/api'

const BACKEND_URL = 'https://large-hairs-relate.loca.lt/api';

export const environment = {
  production: true,
  apiBaseUrl: BACKEND_URL || '/api',
  isMobile: true,
};

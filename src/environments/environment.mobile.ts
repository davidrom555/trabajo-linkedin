/**
 * Configuración para Apps Móviles (iOS/Android con Capacitor)
 * 
 * IMPORTANTE: En móvil, la app corre desde file:// por lo que necesita
 * una URL absoluta al backend. No puede usar rutas relativas como '/api'
 */

// 🔧 CONFIGURA AQUÍ LA URL DE TU BACKEND
// Debe ser accesible desde internet (no localhost)
// Ejemplos:
// - 'https://api.rapidwork.app/api'
// - 'https://rapidwork-api.onrender.com/api'
// - 'https://rapidwork-api.vercel.app/api'

const BACKEND_URL = 'https://large-hairs-relate.loca.lt/api';  // URL de LocalTunnel

// Para testing local con ngrok (expone localhost a internet):
// 1. Instala ngrok: npm install -g ngrok
// 2. Inicia tu servidor: node server/index.js
// 3. Expón el puerto: ngrok http 3333
// 4. Copia la URL HTTPS aquí: 'https://xxxx.ngrok-free.app/api'

export const environment = {
  production: true,
  apiBaseUrl: BACKEND_URL || '/api',
  isMobile: true,
};

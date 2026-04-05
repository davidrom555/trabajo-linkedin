/**
 * Configuración para Apps Móviles (iOS/Android con Capacitor)
 *
 * IMPORTANTE: En móvil, la app corre desde file:// por lo que necesita
 * una URL absoluta al backend. No puede usar rutas relativas como '/api'
 */

const BACKEND_URL = 'https://abc-123.loca.lt/api';

export const environment = {
  production: true,
  apiBaseUrl: BACKEND_URL || '/api',
  isMobile: true,
};

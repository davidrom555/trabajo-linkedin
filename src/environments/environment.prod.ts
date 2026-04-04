/**
 * Configuración de producción
 * 
 * IMPORTANTE: Configura correctamente apiBaseUrl según tu despliegue:
 * 
 * Opción A - Mismo dominio (proxy reverso):
 *   apiBaseUrl: '/api'
 *   Ejemplo: https://tudominio.com/api → tu backend
 * 
 * Opción B - Subdominio separado:
 *   apiBaseUrl: 'https://api.tudominio.com/api'
 * 
 * Opción C - Desarrollo local con producción:
 *   apiBaseUrl: 'http://localhost:3333/api'
 */

// Detectar automáticamente el entorno
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Para producción real, cambia esta URL por la de tu backend
const PRODUCTION_API_URL = '';  // Ejemplo: 'https://api.tudominio.com/api'

export const environment = {
  production: true,
  // Si está en localhost, usa /api (con proxy)
  // Si está en producción y no se configuró URL, usa /api (asume proxy reverso)
  // Si se configuró PRODUCTION_API_URL, úsala
  apiBaseUrl: PRODUCTION_API_URL || '/api',
};

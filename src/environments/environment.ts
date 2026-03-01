/**
 * Variables de entorno para desarrollo.
 *
 * En producción este archivo es reemplazado por environment.prod.ts
 * mediante la configuración fileReplacements en angular.json.
 */
export const environment = {
  production: false,
  /** URL base del backend Scala / Http4s */
  apiUrl: 'http://localhost:8080',
  /** URL WebSocket para previsualización en tiempo real */
  wsUrl: 'ws://localhost:8080',
} as const;

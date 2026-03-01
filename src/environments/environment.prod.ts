/**
 * Variables de entorno para producción.
 * Reemplaza environment.ts mediante fileReplacements en angular.json.
 */
export const environment = {
  production: true,
  /** Reemplazar con el dominio real del VPS */
  apiUrl: 'https://api.tu-dominio.com',
  wsUrl: 'wss://api.tu-dominio.com',
} as const;

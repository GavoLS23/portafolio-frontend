/**
 * Configuración global de la aplicación Angular.
 *
 * Registra los providers en el nivel raíz (ApplicationConfig):
 *  - Router con hash scrolling y progress bar
 *  - HttpClient con el interceptor de autenticación JWT
 *  - Detección de errores del navegador (provideBrowserGlobalErrorListeners)
 *
 * No se usa NgModule — toda la app es Standalone Components.
 */
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withHashLocation,
  withInMemoryScrolling,
} from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
  withFetch,
} from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // ── Error handling global ──────────────────────────────────────────
    provideBrowserGlobalErrorListeners(),

    // ── Router ────────────────────────────────────────────────────────
    provideRouter(
      routes,
      withComponentInputBinding(),       // Permite usar input() con parámetros de ruta
      withInMemoryScrolling({
        scrollPositionRestoration: 'top', // Volver al inicio al navegar
        anchorScrolling: 'enabled',       // Soporte para #anchors
      }),
    ),

    // ── HTTP Client ────────────────────────────────────────────────────
    provideHttpClient(
      withFetch(),                        // Usa la Fetch API nativa (mejor rendimiento)
      withInterceptors([authInterceptor]),// Inyecta JWT en cada request al API
    ),

    // ── Animaciones (requerido por Angular CDK drag-drop) ─────────────
    provideAnimationsAsync(),
  ],
};

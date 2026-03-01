/**
 * Guard de autenticación para las rutas del panel admin.
 *
 * Implementado como función (patrón Angular 17+):
 *  - Si hay token activo → permite el acceso
 *  - Si no hay token    → redirige a /admin/login conservando la URL destino
 *
 * Uso en rutas:
 *  { path: 'admin', canActivate: [authGuard], ... }
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  // Guardamos la URL destino para redirigir después del login
  return router.createUrlTree(['/admin/login'], {
    queryParams: { returnUrl: state.url },
  });
};

/**
 * Interceptor de autenticación HTTP.
 *
 * Agrega el header `Authorization: Bearer <token>` a todas las
 * peticiones que van al backend, excepto:
 *  - El endpoint de login (/auth/login)
 *  - Peticiones externas (S3, CDN, etc.)
 *
 * Implementado como función (patrón Angular 17+) para evitar
 * la complejidad de los interceptores basados en clase.
 *
 * Si el servidor devuelve 401, cierra la sesión automáticamente.
 */
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();

  // Solo inyectar el token en peticiones a nuestra propia API
  const isOwnApi = req.url.startsWith(environment.apiUrl);
  const isLoginEndpoint = req.url.includes('/auth/login');

  if (token && isOwnApi && !isLoginEndpoint) {
    req = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Token expirado o inválido → cerrar sesión
      if (error.status === 401 && isOwnApi && !isLoginEndpoint) {
        auth.logout();
      }
      return throwError(() => error);
    }),
  );
};

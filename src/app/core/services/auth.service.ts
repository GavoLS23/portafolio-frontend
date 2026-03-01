import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse } from '../models/api.models';

const TOKEN_KEY = 'admin_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly token = signal<string | null>(this.getStoredToken());
  readonly isLoggedIn = computed(() => this.token() !== null);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  login(credentials: LoginRequest): void {
    console.log('[AuthService] Login iniciado');
    console.log('[AuthService] API URL:', environment.apiUrl);
    console.log('[AuthService] Credenciales enviadas:', {
      email: credentials.email,
      passwordLength: credentials.password?.length,
    });

    this.isLoading.set(true);
    this.error.set(null);

    this.http
      .post<LoginResponse>(
        `${environment.apiUrl}/api/v1/auth/login`,
        credentials
      )
      .pipe(
        tap((response) => {
          console.log('[AuthService] Respuesta exitosa del backend:', response);

          this.token.set(response.token);
          sessionStorage.setItem(TOKEN_KEY, response.token);

          console.log('[AuthService] Token guardado en sessionStorage');
        })
      )
      .subscribe({
        next: () => {
          console.log('[AuthService] Login exitoso, redirigiendo al dashboard');
          this.isLoading.set(false);
          this.router.navigate(['/admin/dashboard']);
        },
        error: (err) => {
          console.error('[AuthService] Error en login:', err);
          console.error('[AuthService] Status:', err.status);
          console.error('[AuthService] Body:', err.error);

          this.isLoading.set(false);
          this.token.set(null);

          if (err.status === 401) {
            this.error.set('Credenciales incorrectas');
          } else {
            this.error.set('Error de conexión. Intenta de nuevo.');
          }
        },
      });
  }

  logout(): void {
    console.log('[AuthService] Logout');
    this.token.set(null);
    sessionStorage.removeItem(TOKEN_KEY);
    this.router.navigate(['/admin/login']);
  }

  private getStoredToken(): string | null {
    const token = sessionStorage.getItem(TOKEN_KEY);
    console.log('[AuthService] Token inicial desde storage:', token);
    return token;
  }
}

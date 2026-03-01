/**
 * Página de login del panel de administración.
 *
 * Formulario reactivo con validación en tiempo real:
 *  - Email: requerido + formato válido
 *  - Contraseña: requerida + mínimo 6 caracteres
 *
 * Al enviar, llama a AuthService.login() que maneja el JWT y la redirección.
 *
 * Si viene con ?returnUrl=, el AuthService redirige a esa URL tras el login.
 * El manejo del returnUrl está en AuthService.login() via Router.
 */
import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { SpinnerComponent } from '../../../shared/components/spinner.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, SpinnerComponent],
  template: `
    <div class="min-h-screen bg-zinc-900 flex items-center justify-center px-4">
      <div class="w-full max-w-sm">

        <!-- Logo / título -->
        <div class="text-center mb-8">
          <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20
                      flex items-center justify-center mx-auto mb-4">
            <svg class="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-zinc-100">
            {{ 'admin.login.title' | translate }}
          </h1>
          <p class="text-sm text-zinc-400 mt-1">
            {{ 'admin.login.subtitle' | translate }}
          </p>
        </div>

        <!-- Card del formulario -->
        <div class="card p-6 border border-zinc-700">

          <!-- Error de autenticación -->
          @if (auth.error()) {
            <div class="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
              <svg class="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p class="text-sm text-red-400">{{ auth.error() }}</p>
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>

            <!-- Email -->
            <div class="mb-4">
              <label for="email" class="form-label">
                {{ 'admin.login.email' | translate }}
              </label>
              <input
                id="email"
                type="email"
                formControlName="email"
                class="form-input"
                [class.border-red-500]="emailInvalid()"
                autocomplete="username"
                placeholder="admin@ejemplo.com"
              />
              @if (emailInvalid()) {
                <p class="form-error">Ingresa un email válido.</p>
              }
            </div>

            <!-- Contraseña -->
            <div class="mb-6">
              <label for="password" class="form-label">
                {{ 'admin.login.password' | translate }}
              </label>
              <input
                id="password"
                [type]="showPass() ? 'text' : 'password'"
                formControlName="password"
                class="form-input"
                [class.border-red-500]="passInvalid()"
                autocomplete="current-password"
                placeholder="••••••••"
              />
              @if (passInvalid()) {
                <p class="form-error">La contraseña debe tener al menos 6 caracteres.</p>
              }
              <!-- Toggle visibilidad -->
              <button
                type="button"
                class="mt-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                (click)="showPass.set(!showPass())"
              >
                {{ showPass() ? 'Ocultar' : 'Mostrar' }} contraseña
              </button>
            </div>

            <!-- Submit -->
            <button
              type="submit"
              class="btn-primary w-full justify-center"
              [disabled]="form.invalid || auth.isLoading()"
            >
              @if (auth.isLoading()) {
                <app-spinner size="sm" label="Iniciando sesión" />
                {{ 'admin.login.loading' | translate }}
              } @else {
                {{ 'admin.login.submit' | translate }}
              }
            </button>
          </form>
        </div>

        <!-- Link al sitio público -->
        <p class="text-center mt-6 text-sm text-zinc-500">
          <a routerLink="/" class="hover:text-zinc-300 transition-colors">← Volver al sitio</a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  /** Controla si la contraseña es visible */
  readonly showPass = signal(false);

  readonly form = this.fb.nonNullable.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  /** Helpers para mostrar errores de validación */
  emailInvalid(): boolean {
    const ctrl = this.form.controls.email;
    return ctrl.invalid && ctrl.touched;
  }

  passInvalid(): boolean {
    const ctrl = this.form.controls.password;
    return ctrl.invalid && ctrl.touched;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.auth.login(this.form.getRawValue());
  }
}

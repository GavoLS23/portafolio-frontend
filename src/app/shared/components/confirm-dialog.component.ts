/**
 * Diálogo de confirmación modal.
 *
 * Usado para confirmar acciones destructivas (eliminar proyectos, posts, etc.)
 *
 * Inputs:
 *  - title:   string  - Título del diálogo
 *  - message: string  - Mensaje de confirmación
 *  - isOpen:  boolean - Controla visibilidad
 *
 * Outputs:
 *  - confirmed: void  - El usuario confirmó
 *  - cancelled: void  - El usuario canceló
 *
 * Uso:
 *  <app-confirm-dialog
 *    title="Eliminar proyecto"
 *    message="¿Seguro que deseas eliminarlo?"
 *    [isOpen]="showDialog()"
 *    (confirmed)="onConfirm()"
 *    (cancelled)="showDialog.set(false)"
 *  />
 */
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (isOpen()) {
      <!-- Overlay -->
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="'dialog-title'"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          (click)="cancelled.emit()"
        ></div>

        <!-- Panel -->
        <div class="relative z-10 w-full max-w-sm bg-zinc-800 border border-zinc-700 rounded-xl p-6 shadow-2xl animate-fade-in">
          <!-- Ícono de advertencia -->
          <div class="flex items-center gap-3 mb-4">
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 id="dialog-title" class="text-base font-semibold text-zinc-100">
              {{ title() }}
            </h2>
          </div>

          <p class="text-sm text-zinc-400 mb-6">{{ message() }}</p>

          <!-- Acciones -->
          <div class="flex justify-end gap-3">
            <button
              type="button"
              class="btn-secondary"
              (click)="cancelled.emit()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn-danger"
              (click)="confirmed.emit()"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  readonly title = input('Confirmar acción');
  readonly message = input('¿Estás seguro?');
  readonly isOpen = input(false);
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}

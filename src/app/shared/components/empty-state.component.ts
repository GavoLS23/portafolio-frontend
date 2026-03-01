/**
 * Componente de estado vacío.
 *
 * Se muestra cuando una lista no tiene elementos.
 *
 * Inputs:
 *  - message: string     - Texto principal
 *  - icon: string        - SVG path data (opcional)
 *  - actionLabel: string - Texto del botón de acción (opcional)
 *
 * Outputs:
 *  - action: EventEmitter — emitido al hacer clic en el botón de acción
 *
 * Uso:
 *  <app-empty-state
 *    message="No hay proyectos."
 *    actionLabel="Crear proyecto"
 *    (action)="openForm()"
 *  />
 */
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
      <!-- Ícono de caja vacía -->
      <div class="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
        <svg
          class="w-8 h-8 text-zinc-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>

      <p class="text-zinc-400 text-sm mb-4">{{ message() }}</p>

      @if (actionLabel()) {
        <button
          type="button"
          class="btn-primary"
          (click)="action.emit()"
        >
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  readonly message = input('No hay elementos.');
  readonly actionLabel = input('');
  readonly action = output<void>();
}

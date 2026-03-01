/**
 * Gestión de tecnologías en el panel admin.
 *
 * UI compacta tipo "tabla con edición inline":
 *  - Lista todas las tecnologías existentes
 *  - Formulario inline para crear/editar (sin modal separado)
 *  - Eliminar con confirmación
 *
 * Las tecnologías son entidades simples (nombre + iconUrl),
 * por lo que el formulario inline es suficiente.
 */
import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TechnologiesService } from '../../../core/services/technologies.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { SpinnerComponent } from '../../../shared/components/spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog.component';
import { TechnologyResponse } from '../../../core/models/api.models';

@Component({
  selector: 'app-technologies',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    SpinnerComponent,
    EmptyStateComponent,
    ConfirmDialogComponent,
  ],
  template: `
    <div class="space-y-6">

      <!-- Encabezado -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-zinc-100">
          {{ 'admin.technologies.title' | translate }}
        </h1>
        <button type="button" class="btn-primary" (click)="showCreateForm.set(!showCreateForm())">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          {{ 'admin.technologies.new' | translate }}
        </button>
      </div>

      <!-- Formulario de creación (inline colapsable) -->
      @if (showCreateForm()) {
        <div class="card p-5 animate-fade-in">
          <h2 class="text-base font-semibold text-zinc-200 mb-4">Nueva tecnología</h2>
          <form [formGroup]="createForm" (ngSubmit)="onCreate()" class="flex flex-wrap gap-3 items-end">
            <div class="flex-1 min-w-[160px]">
              <label class="form-label">{{ 'admin.technologies.name' | translate }}</label>
              <input
                type="text"
                formControlName="name"
                class="form-input"
                placeholder="Angular, Scala, Docker..."
                [class.border-red-500]="createForm.controls.name.invalid && createForm.controls.name.touched"
              />
            </div>
            <div class="flex-1 min-w-[200px]">
              <label class="form-label">{{ 'admin.technologies.iconUrl' | translate }}</label>
              <input
                type="url"
                formControlName="iconUrl"
                class="form-input"
                placeholder="https://cdn.example.com/icon.svg"
              />
            </div>
            <div class="flex gap-2">
              <button type="submit" class="btn-primary" [disabled]="saving()">
                @if (saving()) { <app-spinner size="sm" /> }
                {{ 'admin.technologies.save' | translate }}
              </button>
              <button type="button" class="btn-secondary" (click)="cancelCreate()">Cancelar</button>
            </div>
          </form>
        </div>
      }

      <!-- Lista de tecnologías -->
      @if (techsSvc.isLoading()) {
        <div class="flex justify-center py-16"><app-spinner size="lg" /></div>
      } @else if (techsSvc.technologies().length === 0) {
        <app-empty-state [message]="'admin.technologies.empty' | translate" />
      } @else {
        <div class="card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-zinc-700">
                  <th class="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider w-8">#</th>
                  <th class="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Nombre</th>
                  <th class="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider hidden sm:table-cell">URL del ícono</th>
                  <th class="px-4 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-800">
                @for (tech of techsSvc.technologies(); track tech.id; let i = $index) {
                  @if (editingId() === tech.id) {
                    <!-- Fila de edición inline -->
                    <tr class="bg-zinc-800/50">
                      <td class="px-4 py-3 text-zinc-600">{{ i + 1 }}</td>
                      <td class="px-4 py-2" [formGroup]="editForm">
                        <input
                          type="text"
                          formControlName="name"
                          class="form-input py-1.5 text-sm"
                          placeholder="Nombre"
                        />
                      </td>
                      <td class="px-4 py-2 hidden sm:table-cell" [formGroup]="editForm">
                        <input
                          type="url"
                          formControlName="iconUrl"
                          class="form-input py-1.5 text-sm"
                          placeholder="https://..."
                        />
                      </td>
                      <td class="px-4 py-2">
                        <div class="flex gap-1">
                          <button type="button" class="btn-primary py-1 px-3 text-xs" (click)="saveEdit(tech.id)">
                            Guardar
                          </button>
                          <button type="button" class="btn-secondary py-1 px-3 text-xs" (click)="editingId.set(null)">
                            Cancelar
                          </button>
                        </div>
                      </td>
                    </tr>
                  } @else {
                    <!-- Fila normal -->
                    <tr class="hover:bg-zinc-800/50 transition-colors group">
                      <td class="px-4 py-3 text-xs text-zinc-600">{{ i + 1 }}</td>
                      <td class="px-4 py-3">
                        <div class="flex items-center gap-2">
                          @if (tech.iconUrl) {
                            <img [src]="tech.iconUrl" [alt]="tech.name" class="w-5 h-5 object-contain" />
                          } @else {
                            <div class="w-5 h-5 rounded bg-zinc-700 flex items-center justify-center">
                              <svg class="w-3 h-3 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
                              </svg>
                            </div>
                          }
                          <span class="font-medium text-zinc-100">{{ tech.name }}</span>
                        </div>
                      </td>
                      <td class="px-4 py-3 hidden sm:table-cell">
                        <span class="text-xs text-zinc-500 font-mono truncate max-w-xs block">
                          {{ tech.iconUrl ?? '—' }}
                        </span>
                      </td>
                      <td class="px-4 py-3">
                        <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <!-- Editar -->
                          <button
                            type="button"
                            class="p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors"
                            title="Editar"
                            (click)="startEdit(tech)"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                          </button>
                          <!-- Eliminar -->
                          <button
                            type="button"
                            class="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Eliminar"
                            (click)="confirmDelete(tech)"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Diálogo de confirmación -->
      <app-confirm-dialog
        [title]="'admin.technologies.delete' | translate"
        [message]="'admin.technologies.deleteConfirm' | translate"
        [isOpen]="showDeleteDialog()"
        (confirmed)="deleteConfirmed()"
        (cancelled)="showDeleteDialog.set(false)"
      />
    </div>
  `,
})
export class TechnologiesComponent implements OnInit {
  readonly techsSvc = inject(TechnologiesService);
  private readonly fb = inject(FormBuilder);

  readonly showCreateForm = signal(false);
  readonly saving = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly showDeleteDialog = signal(false);
  private techToDelete = signal<TechnologyResponse | null>(null);

  readonly createForm = this.fb.nonNullable.group({
    name:    ['', Validators.required],
    iconUrl: [''],
  });

  readonly editForm = this.fb.nonNullable.group({
    name:    ['', Validators.required],
    iconUrl: [''],
  });

  ngOnInit(): void {
    this.techsSvc.load();
  }

  onCreate(): void {
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }

    this.saving.set(true);
    const value = this.createForm.getRawValue();

    this.techsSvc.create({
      name: value.name,
      iconUrl: value.iconUrl || null,
    }).subscribe({
      next: (tech) => {
        this.techsSvc.addLocal(tech);
        this.saving.set(false);
        this.cancelCreate();
      },
      error: () => this.saving.set(false),
    });
  }

  cancelCreate(): void {
    this.showCreateForm.set(false);
    this.createForm.reset();
  }

  startEdit(tech: TechnologyResponse): void {
    this.editingId.set(tech.id);
    this.editForm.patchValue({ name: tech.name, iconUrl: tech.iconUrl ?? '' });
  }

  saveEdit(id: string): void {
    if (this.editForm.invalid) return;
    const value = this.editForm.getRawValue();

    this.techsSvc.update(id, { name: value.name, iconUrl: value.iconUrl || null }).subscribe({
      next: (updated) => {
        this.techsSvc.updateLocal(updated);
        this.editingId.set(null);
      },
    });
  }

  confirmDelete(tech: TechnologyResponse): void {
    this.techToDelete.set(tech);
    this.showDeleteDialog.set(true);
  }

  deleteConfirmed(): void {
    const tech = this.techToDelete();
    if (!tech) return;
    this.techsSvc.delete(tech.id).subscribe({
      next: () => {
        this.techsSvc.removeLocal(tech.id);
        this.showDeleteDialog.set(false);
      },
    });
  }
}

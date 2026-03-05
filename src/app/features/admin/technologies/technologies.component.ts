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
import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  templateUrl: './technologies.component.html',
})
export class TechnologiesComponent implements OnInit {
  readonly techsSvc = inject(TechnologiesService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

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
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

    this.techsSvc.update(id, { name: value.name, iconUrl: value.iconUrl || null }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
    this.techsSvc.delete(tech.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.techsSvc.removeLocal(tech.id);
        this.showDeleteDialog.set(false);
      },
    });
  }
}

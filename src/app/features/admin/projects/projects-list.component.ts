/**
 * Listado de proyectos en el panel admin.
 *
 * Funcionalidades:
 *  - Lista todos los proyectos (publicados + borradores)
 *  - Drag & drop para reordenar (CDK DragDrop)
 *    → Al soltar, envía el nuevo orden al backend via PUT /admin/projects/reorder
 *  - Cambio de estado: publicar / despublicar (toggle inline)
 *  - Eliminar con confirmación modal
 *  - Link a formulario de edición
 *  - Botón para crear nuevo proyecto
 *
 * Reordenamiento: el orden visual se actualiza optimistamente (local)
 * y se persiste en el backend de forma asíncrona.
 */
import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectsService } from '../../../core/services/projects.service';
import { TechnologiesService } from '../../../core/services/technologies.service';
import { LanguageService } from '../../../core/services/language.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { SpinnerComponent } from '../../../shared/components/spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { TagBadgeComponent } from '../../../shared/components/tag-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog.component';
import { ProjectResponse } from '../../../core/models/api.models';

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [
    RouterLink,
    DragDropModule,
    TranslatePipe,
    SpinnerComponent,
    EmptyStateComponent,
    TagBadgeComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './projects-list.component.html',
})
export class ProjectsListComponent implements OnInit {
  readonly projectsSvc = inject(ProjectsService);
  readonly techsSvc = inject(TechnologiesService);
  readonly lang = inject(LanguageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly showDeleteDialog = signal(false);
  private projectToDelete = signal<ProjectResponse | null>(null);

  ngOnInit(): void {
    this.projectsSvc.loadAll();
    this.techsSvc.load();
  }

  /** Maneja el drop del drag & drop y envía el nuevo orden al backend */
  onDrop(event: CdkDragDrop<ProjectResponse[]>): void {
    const list = [...this.projectsSvc.projects()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);

    // Actualiza el orden localmente (optimista)
    this.projectsSvc.projects.set(list);

    // Persiste en el backend
    this.projectsSvc.reorder({ orderedIds: list.map(p => p.id) }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      error: () => {
        // Si falla, recargar para restaurar el orden correcto
        this.projectsSvc.loadAll();
      },
    });
  }

  /** Cambia el estado del proyecto entre publicado y borrador */
  toggleStatus(project: ProjectResponse): void {
    const newStatus = project.status === 'published' ? 'draft' : 'published';
    this.projectsSvc.update(project.id, { status: newStatus }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (updated) => this.projectsSvc.updateLocal(updated),
    });
  }

  confirmDelete(project: ProjectResponse): void {
    this.projectToDelete.set(project);
    this.showDeleteDialog.set(true);
  }

  deleteConfirmed(): void {
    const project = this.projectToDelete();
    if (!project) return;

    this.projectsSvc.delete(project.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.projectsSvc.removeLocal(project.id);
        this.showDeleteDialog.set(false);
        this.projectToDelete.set(null);
      },
    });
  }

  goToNew(): void {
    // Redirigir al formulario de nuevo proyecto
  }

  getTitle(p: ProjectResponse): string {
    const lang = this.lang.lang();
    const t = p.translations.find(t => t.language === lang) ?? p.translations[0];
    return t?.title ?? p.slug;
  }

  getTechName(techId: string): string {
    return this.techsSvc.technologies().find(t => t.id === techId)?.name ?? techId;
  }
}

/**
 * Servicio para gestionar proyectos.
 *
 * Expone métodos tanto para la vista pública (proyectos publicados)
 * como para el panel admin (todos los proyectos incluyendo borradores).
 *
 * Estado reactivo con Signals:
 *  - projects()     → ProjectResponse[]
 *  - isLoading()    → boolean
 *  - error()        → string | null
 */
import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ProjectResponse,
  CreateProjectRequest,
  UpdateProjectRequest,
  ReorderRequest,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1`;

  readonly projects = signal<ProjectResponse[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  // ── Vista pública ─────────────────────────────────────────────────────────

  /**
   * Carga los proyectos publicados (endpoint público, sin auth).
   * Actualiza la señal `projects`.
   */
  loadPublished(): void {
    this.fetch(`${this.base}/projects`);
  }

  /**
   * Devuelve un observable con el detalle de un proyecto por su slug.
   * Usado en la vista de detalle público.
   */
  getBySlug(slug: string): Observable<ProjectResponse> {
    return this.http.get<ProjectResponse>(`${this.base}/projects/${slug}`);
  }

  // ── Panel admin ───────────────────────────────────────────────────────────

  /**
   * Carga todos los proyectos incluyendo borradores.
   * Requiere token JWT (inyectado por el interceptor).
   */
  loadAll(): void {
    this.fetch(`${this.base}/admin/projects`);
  }

  /** Crea un nuevo proyecto (admin) */
  create(payload: CreateProjectRequest): Observable<ProjectResponse> {
    return this.http.post<ProjectResponse>(`${this.base}/admin/projects`, payload);
  }

  /** Actualiza un proyecto existente (admin) */
  update(id: string, payload: UpdateProjectRequest): Observable<ProjectResponse> {
    return this.http.put<ProjectResponse>(`${this.base}/admin/projects/${id}`, payload);
  }

  /** Elimina un proyecto (admin) */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/projects/${id}`);
  }

  /**
   * Reordena los proyectos tras un drag & drop.
   * Envía los IDs en el nuevo orden al backend.
   */
  reorder(payload: ReorderRequest): Observable<void> {
    // Nota: la ruta /reorder debe ir ANTES de /:id en el router del backend.
    return this.http.put<void>(`${this.base}/admin/projects/reorder`, payload);
  }

  // ── Utilidades ────────────────────────────────────────────────────────────

  /** Actualiza la señal local tras crear/editar/eliminar sin refetch */
  updateLocal(updated: ProjectResponse): void {
    this.projects.update((list) =>
      list.map((p) => (p.id === updated.id ? updated : p)),
    );
  }

  addLocal(created: ProjectResponse): void {
    this.projects.update((list) => [...list, created]);
  }

  removeLocal(id: string): void {
    this.projects.update((list) => list.filter((p) => p.id !== id));
  }

  // ── Privado ───────────────────────────────────────────────────────────────

  private fetch(url: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.get<ProjectResponse[]>(url).subscribe({
      next: (data) => {
        this.projects.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los proyectos.');
        this.isLoading.set(false);
      },
    });
  }
}

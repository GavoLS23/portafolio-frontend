/**
 * Servicio para gestionar tecnologías.
 *
 * Endpoint público: GET /api/v1/technologies
 * Endpoints admin:  POST / PUT / DELETE /api/v1/admin/technologies
 */
import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TechnologyResponse, CreateTechnologyRequest } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class TechnologiesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1`;

  readonly technologies = signal<TechnologyResponse[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  // ── Público ───────────────────────────────────────────────────────────────

  /** Carga todas las tecnologías (cache local en la señal) */
  load(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.get<TechnologyResponse[]>(`${this.base}/technologies`).subscribe({
      next: (data) => {
        this.technologies.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las tecnologías.');
        this.isLoading.set(false);
      },
    });
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  create(payload: CreateTechnologyRequest): Observable<TechnologyResponse> {
    return this.http.post<TechnologyResponse>(
      `${this.base}/admin/technologies`,
      payload,
    );
  }

  update(id: string, payload: CreateTechnologyRequest): Observable<TechnologyResponse> {
    return this.http.put<TechnologyResponse>(
      `${this.base}/admin/technologies/${id}`,
      payload,
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/technologies/${id}`);
  }

  // ── Utilidades locales ────────────────────────────────────────────────────

  addLocal(tech: TechnologyResponse): void {
    this.technologies.update((list) => [...list, tech]);
  }

  updateLocal(updated: TechnologyResponse): void {
    this.technologies.update((list) =>
      list.map((t) => (t.id === updated.id ? updated : t)),
    );
  }

  removeLocal(id: string): void {
    this.technologies.update((list) => list.filter((t) => t.id !== id));
  }

  /** Devuelve los nombres de las tecnologías por sus IDs */
  getNamesById(ids: string[]): string[] {
    const map = new Map(this.technologies().map((t) => [t.id, t.name]));
    return ids.map((id) => map.get(id) ?? id);
  }
}

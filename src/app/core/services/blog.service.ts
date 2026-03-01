/**
 * Servicio para gestionar posts del blog.
 *
 * Soporta paginación (page / pageSize) tanto en la vista pública
 * como en el panel admin.
 */
import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BlogPostResponse,
  CreateBlogPostRequest,
  UpdateBlogPostRequest,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1`;

  readonly posts = signal<BlogPostResponse[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  // ── Vista pública ─────────────────────────────────────────────────────────

  loadPublished(page = 1, pageSize = 20): void {
    this.fetch(`${this.base}/blog`, page, pageSize);
  }

  getBySlug(slug: string): Observable<BlogPostResponse> {
    return this.http.get<BlogPostResponse>(`${this.base}/blog/${slug}`);
  }

  // ── Panel admin ───────────────────────────────────────────────────────────

  loadAll(page = 1, pageSize = 20): void {
    this.fetch(`${this.base}/admin/blog`, page, pageSize);
  }

  create(payload: CreateBlogPostRequest): Observable<BlogPostResponse> {
    return this.http.post<BlogPostResponse>(`${this.base}/admin/blog`, payload);
  }

  update(id: string, payload: UpdateBlogPostRequest): Observable<BlogPostResponse> {
    return this.http.put<BlogPostResponse>(`${this.base}/admin/blog/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/blog/${id}`);
  }

  // ── Utilidades locales ────────────────────────────────────────────────────

  updateLocal(updated: BlogPostResponse): void {
    this.posts.update((list) =>
      list.map((p) => (p.id === updated.id ? updated : p)),
    );
  }

  addLocal(created: BlogPostResponse): void {
    this.posts.update((list) => [created, ...list]);
  }

  removeLocal(id: string): void {
    this.posts.update((list) => list.filter((p) => p.id !== id));
  }

  // ── Privado ───────────────────────────────────────────────────────────────

  private fetch(url: string, page: number, pageSize: number): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.http
      .get<BlogPostResponse[]>(url, { params: { page, pageSize } })
      .subscribe({
        next: (data) => {
          this.posts.set(data);
          this.isLoading.set(false);
        },
        error: () => {
          this.error.set('No se pudieron cargar los posts.');
          this.isLoading.set(false);
        },
      });
  }
}

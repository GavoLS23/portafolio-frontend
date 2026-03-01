/**
 * Servicio de gestión de archivos multimedia.
 *
 * Implementa el flujo de 3 pasos para subir archivos a S3:
 *  1. POST /admin/media/presign  → obtiene URL firmada + mediaId
 *  2. PUT <uploadUrl>            → sube el binario directamente (sin interceptor de auth)
 *  3. POST /admin/media/confirm  → guarda metadata y obtiene MediaResponse
 *
 * El flujo es idéntico en dev y producción; solo cambia la uploadUrl.
 */
import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  MediaResponse,
  PresignedUploadRequest,
  PresignedUploadResponse,
  ConfirmUploadRequest,
  MediaType,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/admin/media`;

  readonly mediaList = signal<MediaResponse[]>([]);
  readonly isLoading = signal(false);
  readonly uploadProgress = signal(0);
  readonly error = signal<string | null>(null);

  // ── Listado ───────────────────────────────────────────────────────────────

  loadAll(page = 1, pageSize = 50): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.http
      .get<MediaResponse[]>(this.base, { params: { page, pageSize } })
      .subscribe({
        next: (data) => {
          this.mediaList.set(data);
          this.isLoading.set(false);
        },
        error: () => {
          this.error.set('No se pudieron cargar los archivos.');
          this.isLoading.set(false);
        },
      });
  }

  // ── Subida de archivos (flujo de 3 pasos) ────────────────────────────────

  /**
   * Sube un archivo completo en 3 pasos.
   * Devuelve un Observable con el MediaResponse final.
   *
   * @param file     - Archivo seleccionado por el usuario
   * @param mediaType - 'image' | 'video'
   */
  upload(file: File, mediaType: MediaType): Observable<MediaResponse> {
    this.uploadProgress.set(0);

    // Paso 1: obtener URL firmada
    const presignReq: PresignedUploadRequest = {
      filename: file.name,
      mimeType: file.type,
      mediaType,
      sizeBytes: file.size,
    };

    return this.http
      .post<PresignedUploadResponse>(`${this.base}/presign`, presignReq)
      .pipe(
        switchMap((presigned) => {
          // Paso 2: subir binario directamente (fetch nativo — SIN interceptor de auth)
          // S3 rechaza headers Authorization no firmados.
          return from(
            fetch(presigned.uploadUrl, {
              method: 'PUT',
              body: file,
              headers: { 'Content-Type': file.type },
            }).then(async (res) => {
              if (!res.ok) throw new Error('Error al subir el archivo');
              this.uploadProgress.set(80);
              return presigned;
            }),
          );
        }),
        switchMap((presigned) => {
          // Paso 3: confirmar subida y obtener MediaResponse
          const confirmReq: ConfirmUploadRequest = { mediaId: presigned.mediaId };
          return this.http.post<MediaResponse>(`${this.base}/confirm`, confirmReq);
        }),
      );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  addLocal(media: MediaResponse): void {
    this.mediaList.update((list) => [media, ...list]);
  }

  removeLocal(id: string): void {
    this.mediaList.update((list) => list.filter((m) => m.id !== id));
  }
}

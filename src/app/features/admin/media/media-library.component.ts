/**
 * Biblioteca de medios del panel admin.
 *
 * Funcionalidades:
 *  - Listado en grid de todos los archivos subidos (imágenes y videos)
 *  - Subida de archivos con el flujo de 3 pasos (presign → PUT → confirm)
 *  - Vista previa antes de subir (FileReader API)
 *  - Eliminación con confirmación
 *  - Drag & drop de archivos sobre el área de subida (HTML5 File API)
 *  - Indicador de progreso durante la subida
 *
 * Límites recomendados:
 *  - Imágenes: JPEG, PNG, WebP, SVG (máx. 10 MB)
 *  - Videos: MP4, WebM (máx. 100 MB)
 */
import { Component, OnInit, inject, signal, ElementRef, ViewChild } from '@angular/core';
import { MediaService } from '../../../core/services/media.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { SpinnerComponent } from '../../../shared/components/spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog.component';
import { MediaResponse, MediaType } from '../../../core/models/api.models';
@Component({
  selector: 'app-media-library',
  standalone: true,
  imports: [
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
          {{ 'admin.media.title' | translate }}
        </h1>
        <button type="button" class="btn-primary" (click)="fileInput.click()">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
          </svg>
          {{ 'admin.media.upload' | translate }}
        </button>
      </div>

      <!-- Zona de drag & drop -->
      <div
        class="border-2 border-dashed rounded-xl p-8 text-center transition-colors"
        [class.border-indigo-500]="isDragging()"
        [class.bg-indigo-500/5]="isDragging()"
        [class.border-zinc-700]="!isDragging()"
        (dragover)="onDragOver($event)"
        (dragleave)="isDragging.set(false)"
        (drop)="onDrop($event)"
        (click)="fileInput.click()"
      >
        @if (uploading()) {
          <div class="space-y-3">
            <app-spinner size="lg" />
            <p class="text-sm text-zinc-400">{{ 'admin.media.uploading' | translate }}</p>
            <!-- Barra de progreso -->
            <div class="max-w-xs mx-auto bg-zinc-700 rounded-full h-1.5 overflow-hidden">
              <div
                class="h-full bg-indigo-500 transition-all duration-300 rounded-full"
                [style.width]="mediaSvc.uploadProgress() + '%'"
              ></div>
            </div>
          </div>
        } @else {
          <div class="pointer-events-none">
            <svg class="w-10 h-10 text-zinc-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            <p class="text-sm text-zinc-400">
              {{ 'admin.media.dropHere' | translate }}
              <span class="text-indigo-400">{{ 'admin.media.browse' | translate }}</span>
            </p>
            <p class="text-xs text-zinc-600 mt-1">
              JPEG, PNG, WebP, SVG, MP4, WebM
            </p>
          </div>
        }
      </div>

      <!-- Input de archivo oculto -->
      <input
        #fileInput
        type="file"
        class="hidden"
        accept="image/*,video/*"
        (change)="onFileSelected($event)"
      />

      <!-- Error de subida -->
      @if (uploadError()) {
        <div class="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p class="text-sm text-red-400">{{ uploadError() }}</p>
        </div>
      }

      <!-- Vista previa del archivo seleccionado (antes de subir) -->
      @if (previewUrl() && !uploading()) {
        <div class="card p-4 flex items-center gap-4">
          <div class="w-16 h-12 rounded overflow-hidden bg-zinc-700 flex-shrink-0">
            <img [src]="previewUrl()!" alt="Vista previa" class="w-full h-full object-cover" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-zinc-200 truncate">{{ pendingFile()?.name }}</p>
            <p class="text-xs text-zinc-500">{{ formatSize(pendingFile()?.size ?? 0) }}</p>
          </div>
          <div class="flex gap-2">
            <button type="button" class="btn-primary" (click)="uploadPendingFile()">Subir</button>
            <button type="button" class="btn-danger" (click)="cancelPreview()">Cancelar</button>
          </div>
        </div>
      }

      <!-- Grid de medios -->
      @if (mediaSvc.isLoading() && mediaSvc.mediaList().length === 0) {
        <div class="flex justify-center py-16"><app-spinner size="lg" /></div>
      } @else if (mediaSvc.mediaList().length === 0) {
        <app-empty-state [message]="'admin.media.empty' | translate" />
      } @else {
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          @for (media of mediaSvc.mediaList(); track media.id) {
            <div class="group relative rounded-lg overflow-hidden bg-zinc-800 aspect-square border border-zinc-700/50 hover:border-zinc-500 transition-colors">
              <!-- Imagen o ícono de video -->
              @if (media.mediaType === 'image') {
                <img
                  [src]="media.url"
                  [alt]="media.filename"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
              } @else {
                <div class="w-full h-full flex flex-col items-center justify-center p-2">
                  <svg class="w-8 h-8 text-zinc-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p class="text-xs text-zinc-500 truncate max-w-full px-1">{{ media.filename }}</p>
                </div>
              }

              <!-- Overlay con acciones (hover) -->
              <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <!-- Info -->
                <p class="text-xs text-zinc-300 text-center px-2 truncate max-w-full">
                  {{ media.filename }}
                </p>
                <p class="text-xs text-zinc-500">{{ formatSize(media.sizeBytes) }}</p>

                <!-- Copiar URL -->
                <button
                  type="button"
                  class="px-2 py-1 rounded bg-zinc-700 text-xs text-zinc-200 hover:bg-zinc-600 transition-colors"
                  (click)="copyUrl(media.url)"
                >
                  {{ copied() === media.id ? '¡Copiado!' : 'Copiar URL' }}
                </button>

                <!-- Eliminar -->
                <button
                  type="button"
                  class="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  (click)="confirmDelete(media)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Diálogo de confirmación -->
      <app-confirm-dialog
        [title]="'admin.media.delete' | translate"
        [message]="'admin.media.deleteConfirm' | translate"
        [isOpen]="showDeleteDialog()"
        (confirmed)="deleteConfirmed()"
        (cancelled)="showDeleteDialog.set(false)"
      />
    </div>
  `,
})
export class MediaLibraryComponent implements OnInit {
  readonly mediaSvc = inject(MediaService);

  readonly isDragging = signal(false);
  readonly uploading = signal(false);
  readonly uploadError = signal<string | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly pendingFile = signal<File | null>(null);
  readonly showDeleteDialog = signal(false);
  readonly copied = signal<string | null>(null);

  private mediaToDelete = signal<MediaResponse | null>(null);

  ngOnInit(): void {
    this.mediaSvc.loadAll();
  }

  // ── Drag & Drop ───────────────────────────────────────────────────────────

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.prepareFile(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.prepareFile(file);
    input.value = ''; // reset para permitir seleccionar el mismo archivo de nuevo
  }

  // ── Vista previa ──────────────────────────────────────────────────────────

  private prepareFile(file: File): void {
    this.pendingFile.set(file);
    this.uploadError.set(null);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => this.previewUrl.set(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      this.previewUrl.set(null);
      // Para videos, subir directamente sin vista previa
      this.uploadPendingFile();
    }
  }

  uploadPendingFile(): void {
    const file = this.pendingFile();
    if (!file) return;

    const mediaType: MediaType = file.type.startsWith('image/') ? 'image' : 'video';

    this.uploading.set(true);
    this.uploadError.set(null);
    this.previewUrl.set(null);

    this.mediaSvc.upload(file, mediaType).subscribe({
      next: (media) => {
        this.mediaSvc.addLocal(media);
        this.uploading.set(false);
        this.pendingFile.set(null);
        this.mediaSvc.uploadProgress.set(100);
        setTimeout(() => this.mediaSvc.uploadProgress.set(0), 1000);
      },
      error: () => {
        this.uploading.set(false);
        this.uploadError.set('Error al subir el archivo. Verifica el tamaño y formato.');
      },
    });
  }

  cancelPreview(): void {
    this.previewUrl.set(null);
    this.pendingFile.set(null);
  }

  // ── Eliminar ──────────────────────────────────────────────────────────────

  confirmDelete(media: MediaResponse): void {
    this.mediaToDelete.set(media);
    this.showDeleteDialog.set(true);
  }

  deleteConfirmed(): void {
    const media = this.mediaToDelete();
    if (!media) return;
    this.mediaSvc.delete(media.id).subscribe({
      next: () => {
        this.mediaSvc.removeLocal(media.id);
        this.showDeleteDialog.set(false);
      },
    });
  }

  // ── Utilidades ────────────────────────────────────────────────────────────

  async copyUrl(url: string): Promise<void> {
    await navigator.clipboard.writeText(url);
    this.copied.set(url);
    setTimeout(() => this.copied.set(null), 2000);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

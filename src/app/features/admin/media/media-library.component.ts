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
import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  templateUrl: './media-library.component.html',
})
export class MediaLibraryComponent implements OnInit {
  readonly mediaSvc = inject(MediaService);
  private readonly destroyRef = inject(DestroyRef);

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

    this.mediaSvc.upload(file, mediaType).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
    this.mediaSvc.delete(media.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

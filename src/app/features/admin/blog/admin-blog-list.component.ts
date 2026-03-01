/**
 * Listado de posts de blog en el panel admin.
 *
 * Muestra todos los posts (publicados y borradores) en una tabla responsiva.
 * Permite: cambiar estado (publicar/borrador), editar y eliminar con confirmación.
 */
import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BlogService } from '../../../core/services/blog.service';
import { LanguageService } from '../../../core/services/language.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { SpinnerComponent } from '../../../shared/components/spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { TagBadgeComponent } from '../../../shared/components/tag-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog.component';
import { BlogPostResponse } from '../../../core/models/api.models';

@Component({
  selector: 'app-admin-blog-list',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    TranslatePipe,
    SpinnerComponent,
    EmptyStateComponent,
    TagBadgeComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './admin-blog-list.component.html',
})
export class AdminBlogListComponent implements OnInit {
  readonly blogSvc = inject(BlogService);
  readonly lang = inject(LanguageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly showDeleteDialog = signal(false);
  private postToDelete = signal<BlogPostResponse | null>(null);

  ngOnInit(): void {
    this.blogSvc.loadAll();
  }

  getTitle(post: BlogPostResponse): string {
    const lang = this.lang.lang();
    const t = post.translations.find(t => t.language === lang) ?? post.translations[0];
    return t?.title ?? post.slug;
  }

  toggleStatus(post: BlogPostResponse): void {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    this.blogSvc.update(post.id, { status: newStatus }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (updated) => this.blogSvc.updateLocal(updated),
    });
  }

  confirmDelete(post: BlogPostResponse): void {
    this.postToDelete.set(post);
    this.showDeleteDialog.set(true);
  }

  deleteConfirmed(): void {
    const post = this.postToDelete();
    if (!post) return;
    this.blogSvc.delete(post.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.blogSvc.removeLocal(post.id);
        this.showDeleteDialog.set(false);
      },
    });
  }
}

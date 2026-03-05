/**
 * Página de detalle de un post de blog.
 *
 * Carga el post por slug y renderiza el contenido HTML generado por TipTap.
 * Muestra: título, extracto, fecha de publicación, tags y el cuerpo completo.
 *
 * Seguridad: el innerHTML no aplica XSS adicional porque el contenido
 * viene de nuestro propio backend (confiable) y Angular escapa el HTML
 * automáticamente en interpolaciones — solo usamos innerHTML para el
 * contenido enriquecido que viene del editor.
 */
import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { switchMap, catchError, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BlogService } from '../../../core/services/blog.service';
import { LanguageService } from '../../../core/services/language.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { SpinnerComponent } from '../../../shared/components/spinner.component';
import { BlogPostResponse } from '../../../core/models/api.models';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, TranslatePipe, SpinnerComponent],
  templateUrl: './blog-detail.component.html',
})
export class BlogDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly blogService = inject(BlogService);
  private readonly destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);

  readonly post = signal<BlogPostResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const slug = params.get('slug') ?? '';
          return this.blogService.getBySlug(slug).pipe(
            catchError(() => {
              this.error.set('notFound');
              this.loading.set(false);
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((data) => {
        this.post.set(data);
        this.loading.set(false);
      });
  }

  getTitle(p: BlogPostResponse): string {
    return this.findT(p)?.title ?? p.slug;
  }

  getExcerpt(p: BlogPostResponse): string {
    return this.findT(p)?.excerpt ?? '';
  }

  getContent(p: BlogPostResponse): string {
    return this.findT(p)?.content ?? '';
  }

  private findT(p: BlogPostResponse) {
    const lang = this.lang.lang();
    return p.translations.find(t => t.language === lang) ?? p.translations[0];
  }
}

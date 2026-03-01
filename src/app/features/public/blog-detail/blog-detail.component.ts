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
import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { switchMap, catchError, of } from 'rxjs';
import { BlogService } from '../../../core/services/blog.service';
import { LanguageService } from '../../../core/services/language.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { SpinnerComponent } from '../../../shared/components/spinner.component';
import { TagBadgeComponent } from '../../../shared/components/tag-badge.component';
import { BlogPostResponse } from '../../../core/models/api.models';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, TranslatePipe, SpinnerComponent, TagBadgeComponent],
  template: `
    <div class="section-container py-8 sm:py-12">

      <!-- Botón volver -->
      <a
        routerLink="/blog"
        class="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors mb-8"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        {{ 'blog.back' | translate }}
      </a>

      <!-- Estado: cargando -->
      @if (loading()) {
        <div class="flex justify-center py-24">
          <app-spinner size="lg" />
        </div>
      }

      <!-- Estado: no encontrado -->
      @else if (error()) {
        <div class="text-center py-24">
          <p class="text-zinc-400 mb-4">{{ 'blog.notFound' | translate }}</p>
          <a routerLink="/blog" class="btn-primary">{{ 'blog.back' | translate }}</a>
        </div>
      }

      <!-- Post cargado -->
      @else if (post()) {
        @let p = post()!;

        <article class="max-w-2xl mx-auto">
          <!-- Tags -->
          <div class="flex flex-wrap gap-2 mb-6">
            @for (tag of p.tags; track tag) {
              <app-tag-badge [label]="tag" color="indigo" />
            }
          </div>

          <!-- Título -->
          <h1 class="text-4xl sm:text-5xl font-bold text-zinc-100 leading-tight mb-4">
            {{ getTitle(p) }}
          </h1>

          <!-- Extracto -->
          <p class="text-xl text-zinc-400 leading-relaxed mb-6">
            {{ getExcerpt(p) }}
          </p>

          <!-- Meta -->
          @if (p.publishedAt) {
            <div class="flex items-center gap-2 text-sm text-zinc-500 mb-8 pb-8 border-b border-zinc-800">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              {{ 'blog.publishedAt' | translate }}
              <time [dateTime]="p.publishedAt">{{ p.publishedAt | date:'longDate' }}</time>
            </div>
          }

          <!-- Contenido HTML del editor TipTap -->
          <div
            class="
              text-zinc-300 leading-relaxed
              prose-headings:text-zinc-100 prose-headings:font-semibold
              prose-p:text-zinc-300 prose-p:leading-relaxed
              prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline
              prose-code:text-indigo-300 prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-zinc-800 prose-pre:border prose-pre:border-zinc-700
              prose-blockquote:border-l-indigo-500 prose-blockquote:text-zinc-400
              prose-strong:text-zinc-200
              prose-ul:text-zinc-300 prose-ol:text-zinc-300
              [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4
              [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3
              [&_h3]:text-xl [&_h3]:font-medium [&_h3]:mt-5 [&_h3]:mb-2
              [&_p]:mb-4 [&_ul]:mb-4 [&_ol]:mb-4
              [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6
              [&_li]:mb-1
              [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4
              [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-4
              [&_code]:text-sm [&_pre_code]:bg-transparent [&_pre_code]:p-0
            "
            [innerHTML]="getContent(p)"
          ></div>
        </article>
      }
    </div>
  `,
})
export class BlogDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly blogService = inject(BlogService);
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

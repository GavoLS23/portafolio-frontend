/**
 * Listado público del blog.
 *
 * Muestra todos los posts publicados en formato grid de tarjetas.
 * Implementa paginación básica por botón "Cargar más".
 *
 * Los posts se muestran en el idioma activo del usuario.
 */
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { BlogService } from '../../../core/services/blog.service';
import { LanguageService } from '../../../core/services/language.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { SpinnerComponent } from '../../../shared/components/spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { BlogPostResponse } from '../../../core/models/api.models';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    TranslatePipe,
    SpinnerComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="section-container py-16 sm:py-24">

      <!-- Header de sección -->
      <div class="mb-12">
        <span class="section-label">03 / Writing</span>
        <h1 class="section-title mt-2">{{ 'blog.title' | translate }}</h1>
        <p class="section-subtitle">{{ 'blog.subtitle' | translate }}</p>
      </div>

      <!-- Estado de carga -->
      @if (blog.isLoading() && blog.posts().length === 0) {
        <div class="flex justify-center py-24">
          <app-spinner size="lg" />
        </div>
      } @else if (blog.error()) {
        <p class="text-center text-red-400 py-8">{{ blog.error() }}</p>
      } @else if (blog.posts().length === 0) {
        <app-empty-state [message]="'blog.empty' | translate" />
      } @else {

        <!-- Grid de posts -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          @for (post of blog.posts(); track post.id) {
            <article
              [routerLink]="['/blog', post.slug]"
              class="group cursor-pointer border-l-2 border-surface-600 hover:border-accent-500
                     pl-4 py-1 transition-all duration-300"
            >
              <!-- Tags -->
              <div class="flex flex-wrap gap-3 mb-3">
                @for (tag of post.tags.slice(0, 2); track tag) {
                  <span class="font-mono text-[10px] tracking-[0.2em] uppercase
                               text-accent-500/55 group-hover:text-accent-500/85 transition-colors">
                    #{{ tag }}
                  </span>
                }
              </div>

              <!-- Título -->
              <h2 class="text-sm font-bold text-cream-900 mb-2
                         group-hover:text-accent-400 transition-colors leading-snug">
                {{ getTitle(post) }}
              </h2>

              <!-- Extracto -->
              <p class="text-xs text-cream-900/50 line-clamp-3 mb-4 leading-relaxed">
                {{ getExcerpt(post) }}
              </p>

              <!-- Footer -->
              <div class="flex items-center justify-between text-xs">
                @if (post.publishedAt) {
                  <time class="font-mono text-cream-900/25" [dateTime]="post.publishedAt">
                    {{ post.publishedAt | date:'dd MMM yyyy' }}
                  </time>
                }
                <span class="font-mono text-[10px] tracking-wide uppercase
                             text-accent-500/55 group-hover:text-accent-400 transition-colors">
                  {{ 'blog.readMore' | translate }} →
                </span>
              </div>
            </article>
          }
        </div>

        <!-- Paginación: Cargar más -->
        @if (hasMore()) {
          <div class="text-center">
            <button
              type="button"
              class="btn-secondary"
              (click)="loadMore()"
              [disabled]="blog.isLoading()"
            >
              @if (blog.isLoading()) {
                <app-spinner size="sm" />
              } @else {
                {{ 'blog.loadMore' | translate }}
              }
            </button>
          </div>
        }
      }
    </div>
  `,
})
export class BlogListComponent implements OnInit {
  readonly blog = inject(BlogService);
  readonly lang = inject(LanguageService);

  private currentPage = signal(1);
  readonly hasMore = signal(true);

  private readonly PAGE_SIZE = 9;

  ngOnInit(): void {
    this.blog.loadPublished(1, this.PAGE_SIZE);
  }

  loadMore(): void {
    const nextPage = this.currentPage() + 1;
    this.currentPage.set(nextPage);
    // Nota: cargar más posts en una implementación real añadiría al array existente.
    // Aquí se simplifica recargando con más pageSize.
    this.blog.loadPublished(1, nextPage * this.PAGE_SIZE);
  }

  getTitle(post: BlogPostResponse): string {
    const t = post.translations.find(t => t.language === this.lang.lang())
      ?? post.translations[0];
    return t?.title ?? post.slug;
  }

  getExcerpt(post: BlogPostResponse): string {
    const t = post.translations.find(t => t.language === this.lang.lang())
      ?? post.translations[0];
    return t?.excerpt ?? '';
  }
}

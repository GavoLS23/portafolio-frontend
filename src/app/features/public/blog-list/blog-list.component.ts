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
import { TagBadgeComponent } from '../../../shared/components/tag-badge.component';
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
    TagBadgeComponent,
  ],
  template: `
    <div class="section-container py-12 sm:py-16">

      <!-- Header de sección -->
      <div class="mb-10">
        <h1 class="section-title">{{ 'blog.title' | translate }}</h1>
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
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          @for (post of blog.posts(); track post.id) {
            <article
              [routerLink]="['/blog', post.slug]"
              class="card-hover group cursor-pointer flex flex-col overflow-hidden"
            >
              <!-- Cabecera de color (placeholder imagen) -->
              <div class="h-2 bg-gradient-to-r from-indigo-600 to-violet-600"></div>

              <div class="p-5 flex flex-col flex-1">
                <!-- Tags -->
                <div class="flex flex-wrap gap-1.5 mb-3">
                  @for (tag of post.tags.slice(0, 3); track tag) {
                    <app-tag-badge [label]="tag" color="indigo" />
                  }
                </div>

                <!-- Título -->
                <h2 class="text-lg font-semibold text-zinc-100 mb-2 group-hover:text-indigo-400 transition-colors">
                  {{ getTitle(post) }}
                </h2>

                <!-- Extracto -->
                <p class="text-sm text-zinc-400 line-clamp-3 mb-4 flex-1">
                  {{ getExcerpt(post) }}
                </p>

                <!-- Footer de la tarjeta -->
                <div class="flex items-center justify-between pt-3 border-t border-zinc-700/50 text-xs">
                  @if (post.publishedAt) {
                    <time class="text-zinc-500" [dateTime]="post.publishedAt">
                      {{ post.publishedAt | date:'mediumDate' }}
                    </time>
                  }
                  <span class="text-indigo-400 group-hover:text-indigo-300 font-medium transition-colors">
                    {{ 'blog.readMore' | translate }} →
                  </span>
                </div>
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
                Cargar más
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

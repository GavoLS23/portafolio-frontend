/**
 * Página principal (Home) del portafolio.
 *
 * Secciones:
 *  1. Hero     — Presentación, rol, bio y CTAs
 *  2. Projects — Grid de tarjetas de proyectos publicados
 *  3. Blog     — Grid de posts recientes (primeros 3)
 *
 * Datos: cargados al montar via ProjectsService y BlogService.
 * Tecnologías: cargadas para mostrar nombres en las tarjetas de proyectos.
 *
 * Estado de carga:
 *  - Muestra skeleton/spinner mientras se cargan los datos
 *  - Muestra EmptyStateComponent si no hay elementos
 *  - Muestra mensaje de error si falla la API
 */
import { Component, inject, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProjectsService } from '../../../core/services/projects.service';
import { BlogService } from '../../../core/services/blog.service';
import { TechnologiesService } from '../../../core/services/technologies.service';
import { LanguageService } from '../../../core/services/language.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { SpinnerComponent } from '../../../shared/components/spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { TagBadgeComponent } from '../../../shared/components/tag-badge.component';
import { ProjectResponse, BlogPostResponse, ProjectTranslation, BlogTranslation } from '../../../core/models/api.models';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    SpinnerComponent,
    EmptyStateComponent,
    TagBadgeComponent,
    DatePipe,
  ],
  template: `
    <!-- ── Hero ──────────────────────────────────────────────────────────── -->
    <section class="relative overflow-hidden">
      <!-- Gradient de fondo -->
      <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px]
                    bg-indigo-600/10 blur-3xl rounded-full"></div>
      </div>

      <div class="section-container relative py-24 sm:py-32">
        <div class="max-w-2xl">
          <!-- Greeting -->
          <p class="text-indigo-400 font-mono text-sm mb-4 animate-fade-in">
            {{ 'hero.greeting' | translate }}
          </p>

          <!-- Nombre -->
          <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold text-zinc-100 leading-tight mb-4 animate-slide-up">
            Nombre Apellido
          </h1>

          <!-- Rol -->
          <p class="text-2xl sm:text-3xl font-medium text-zinc-400 mb-6 animate-slide-up">
            {{ 'hero.role' | translate }}
          </p>

          <!-- Bio -->
          <p class="text-lg text-zinc-500 leading-relaxed mb-8 max-w-xl animate-fade-in">
            {{ 'hero.bio' | translate }}
          </p>

          <!-- CTAs -->
          <div class="flex flex-wrap gap-4">
            <a href="#projects" class="btn-primary">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
              {{ 'hero.viewProjects' | translate }}
            </a>
            <a routerLink="/blog" class="btn-secondary">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
              </svg>
              {{ 'hero.readBlog' | translate }}
            </a>
          </div>

          <!-- Stack tecnológico -->
          <div class="flex flex-wrap gap-2 mt-10">
            @for (tech of heroTechs; track tech) {
              <app-tag-badge [label]="tech" color="zinc" />
            }
          </div>
        </div>
      </div>
    </section>

    <!-- ── Proyectos ──────────────────────────────────────────────────── -->
    <section id="projects" class="section-container py-16 sm:py-20">
      <div class="mb-10">
        <h2 class="section-title">{{ 'projects.title' | translate }}</h2>
        <p class="section-subtitle">{{ 'projects.subtitle' | translate }}</p>
      </div>

      <!-- Estado de carga -->
      @if (projects.isLoading()) {
        <div class="flex justify-center py-16">
          <app-spinner size="lg" />
        </div>
      } @else if (projects.error()) {
        <p class="text-center text-red-400 py-8">{{ projects.error() }}</p>
      } @else if (projects.projects().length === 0) {
        <app-empty-state [message]="'projects.empty' | translate" />
      } @else {
        <!-- Grid de proyectos -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (project of projects.projects(); track project.id) {
            <article class="card-hover group flex flex-col overflow-hidden">
              <!-- Thumbnail -->
              <div class="aspect-video bg-zinc-700/50 overflow-hidden">
                @if (project.thumbnailMediaId) {
                  <div class="w-full h-full flex items-center justify-center">
                    <svg class="w-12 h-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                } @else {
                  <!-- Placeholder con gradiente -->
                  <div class="w-full h-full bg-gradient-to-br from-indigo-900/40 to-zinc-800 flex items-center justify-center">
                    <span class="text-4xl font-bold text-indigo-500/30 font-mono">
                      {{ getTitle(project).charAt(0) }}
                    </span>
                  </div>
                }
              </div>

              <!-- Contenido -->
              <div class="p-5 flex flex-col flex-1">
                <h3 class="text-lg font-semibold text-zinc-100 mb-2 group-hover:text-indigo-400 transition-colors">
                  {{ getTitle(project) }}
                </h3>
                <p class="text-sm text-zinc-400 leading-relaxed mb-4 flex-1 line-clamp-3">
                  {{ getDescription(project) }}
                </p>

                <!-- Tecnologías -->
                <div class="flex flex-wrap gap-1.5 mb-4">
                  @for (techId of project.technologyIds.slice(0, 4); track techId) {
                    <app-tag-badge [label]="getTechName(techId)" color="zinc" />
                  }
                  @if (project.technologyIds.length > 4) {
                    <app-tag-badge [label]="'+' + (project.technologyIds.length - 4)" color="zinc" />
                  }
                </div>

                <!-- Links -->
                <div class="flex gap-3 mt-auto pt-2 border-t border-zinc-700/50">
                  <a
                    [routerLink]="['/project', project.slug]"
                    class="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Ver detalle →
                  </a>
                  @if (project.demoUrl) {
                    <a
                      [href]="project.demoUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      {{ 'projects.viewDemo' | translate }}
                    </a>
                  }
                  @if (project.repositoryUrl) {
                    <a
                      [href]="project.repositoryUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      {{ 'projects.viewCode' | translate }}
                    </a>
                  }
                </div>
              </div>
            </article>
          }
        </div>
      }
    </section>

    <!-- ── Blog reciente ──────────────────────────────────────────────── -->
    <section class="bg-zinc-800/30 border-t border-b border-zinc-800">
      <div class="section-container py-16 sm:py-20">
        <div class="flex items-center justify-between mb-10">
          <div>
            <h2 class="section-title">{{ 'blog.title' | translate }}</h2>
            <p class="section-subtitle">{{ 'blog.subtitle' | translate }}</p>
          </div>
          <a routerLink="/blog" class="hidden sm:flex btn-secondary">
            Ver todos →
          </a>
        </div>

        <!-- Estado de carga -->
        @if (blog.isLoading()) {
          <div class="flex justify-center py-16">
            <app-spinner size="lg" />
          </div>
        } @else if (blog.posts().length === 0) {
          <app-empty-state [message]="'blog.empty' | translate" />
        } @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (post of recentPosts(); track post.id) {
              <article
                [routerLink]="['/blog', post.slug]"
                class="card-hover p-5 cursor-pointer group"
              >
                <!-- Tags -->
                <div class="flex flex-wrap gap-1.5 mb-3">
                  @for (tag of post.tags.slice(0, 2); track tag) {
                    <app-tag-badge [label]="tag" color="indigo" />
                  }
                </div>

                <h3 class="text-base font-semibold text-zinc-100 mb-2 group-hover:text-indigo-400 transition-colors">
                  {{ getBlogTitle(post) }}
                </h3>
                <p class="text-sm text-zinc-400 line-clamp-2 mb-4">
                  {{ getBlogExcerpt(post) }}
                </p>

                <div class="flex items-center justify-between text-xs text-zinc-500">
                  @if (post.publishedAt) {
                    <time [dateTime]="post.publishedAt">
                      {{ post.publishedAt | date:'mediumDate' }}
                    </time>
                  }
                  <span class="text-indigo-400 group-hover:text-indigo-300 font-medium">
                    {{ 'blog.readMore' | translate }} →
                  </span>
                </div>
              </article>
            }
          </div>

          <!-- Ver todos (mobile) -->
          <div class="sm:hidden mt-6 text-center">
            <a routerLink="/blog" class="btn-secondary">
              Ver todos los posts
            </a>
          </div>
        }
      </div>
    </section>
  `,
})
export class HomeComponent implements OnInit {
  readonly projects = inject(ProjectsService);
  readonly blog = inject(BlogService);
  readonly techs = inject(TechnologiesService);
  readonly lang = inject(LanguageService);

  /** Posts más recientes para mostrar en el home (max 3) */
  readonly recentPosts = computed(() => this.blog.posts().slice(0, 3));

  /** Tecnologías del hero (decorativas) */
  readonly heroTechs = ['Scala 3', 'Angular', 'TypeScript', 'PostgreSQL', 'AWS S3', 'Docker'];

  ngOnInit(): void {
    this.projects.loadPublished();
    this.blog.loadPublished(1, 6);
    this.techs.load();
  }

  /** Devuelve el título del proyecto en el idioma activo */
  getTitle(project: ProjectResponse): string {
    const t = this.findTranslation(project.translations);
    return t?.title ?? project.slug;
  }

  /** Devuelve la descripción corta del proyecto */
  getDescription(project: ProjectResponse): string {
    const t = this.findTranslation(project.translations);
    return t?.description ?? '';
  }

  /** Devuelve el nombre de una tecnología por su ID */
  getTechName(techId: string): string {
    return this.techs.technologies().find(t => t.id === techId)?.name ?? techId;
  }

  /** Devuelve el título de un post en el idioma activo */
  getBlogTitle(post: BlogPostResponse): string {
    const t = this.findBlogTranslation(post.translations);
    return t?.title ?? post.slug;
  }

  /** Devuelve el extracto de un post en el idioma activo */
  getBlogExcerpt(post: BlogPostResponse): string {
    const t = this.findBlogTranslation(post.translations);
    return t?.excerpt ?? '';
  }

  // ── Privado ───────────────────────────────────────────────────────────────

  private findTranslation(translations: ProjectTranslation[]) {
    const lang = this.lang.lang();
    return translations.find(t => t.language === lang)
      ?? translations[0];
  }

  private findBlogTranslation(translations: BlogTranslation[]) {
    const lang = this.lang.lang();
    return translations.find(t => t.language === lang)
      ?? translations[0];
  }
}

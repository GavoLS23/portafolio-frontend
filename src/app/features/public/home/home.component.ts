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
    <section class="relative overflow-hidden border-b border-surface-700">
      <div class="absolute inset-0 bg-grid-texture pointer-events-none" aria-hidden="true"></div>
      <div
        class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(45,96,115,0.25)_0%,transparent_65%)] pointer-events-none"
        aria-hidden="true"></div>

      <div class="section-container relative py-24 sm:py-36">
        <div class="grid lg:grid-cols-[1fr_200px] gap-12 items-start">

          <!-- Bloque de texto principal -->
          <div>
            <div class="flex items-center gap-4 mb-8 animate-fade-in">
              <span class="section-label">01 / Portfolio</span>
              <div class="h-px w-12 bg-surface-600"></div>
            </div>

            <p class="section-label mb-3 animate-fade-in" style="animation-delay: 0.22s">
              {{ 'hero.greeting' | translate }}
            </p>

            <h1
              class="text-[clamp(3.5rem,10vw,7rem)] font-serif italic text-cream-900
                     leading-[0.88] tracking-tighter mb-6 animate-slide-up"
              style="animation-delay: 0.08s"
            >
              Gustavo de Jes&uacute;s<br>
              <span class="not-italic text-accent-500">Le&oacute;n Santos</span>
            </h1>

            <p
              class="text-xl sm:text-2xl font-semibold text-cream-900/60 tracking-wide mb-3 animate-slide-up"
              style="animation-delay: 0.16s"
            >
              {{ 'hero.role' | translate }}
            </p>

            <p
              class="font-serif text-base text-cream-900/55 leading-relaxed max-w-lg mb-10 animate-fade-in"
              style="animation-delay: 0.28s"
            >
              {{ 'hero.bio' | translate }}
            </p>

            <div class="flex flex-wrap gap-4 animate-slide-up" style="animation-delay: 0.36s">
              <a href="#projects" class="btn-primary">
                {{ 'hero.viewProjects' | translate }}
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </a>
              <a routerLink="/blog" class="btn-secondary">
                {{ 'hero.readBlog' | translate }}
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </a>
            </div>
          </div>

          <!-- Stack tecnológico (desktop) -->
          <div
            class="hidden lg:flex flex-col gap-3 pt-2 border-l border-surface-700 pl-8 animate-slide-left"
            style="animation-delay: 0.28s"
          >
            <p class="section-label mb-2">Stack</p>
            @for (tech of heroTechs; track tech) {
              <div class="flex items-center gap-3 group">
                <div class="w-1 h-1 bg-accent-500/40 group-hover:bg-accent-500 transition-colors shrink-0"></div>
                <span
                  class="font-mono text-xs text-cream-900/45 group-hover:text-cream-900/85 transition-colors whitespace-nowrap">
                  {{ tech }}
                </span>
              </div>
            }
          </div>
        </div>

        <!-- Stack tecnológico (mobile) -->
        <div class="lg:hidden flex flex-wrap gap-2 mt-10">
          @for (tech of heroTechs; track tech) {
            <app-tag-badge [label]="tech" color="zinc"/>
          }
        </div>
      </div>
    </section>

    <!-- ── Proyectos ──────────────────────────────────────────────────── -->
    <section id="projects" class="section-container py-16 sm:py-24">
      <div class="flex items-end justify-between mb-12">
        <div>
          <span class="section-label">02 / Work</span>
          <h2 class="section-title mt-2">{{ 'projects.title' | translate }}</h2>
          <p class="section-subtitle">{{ 'projects.subtitle' | translate }}</p>
        </div>
      </div>

      @if (projects.isLoading()) {
        <div class="flex justify-center py-16">
          <app-spinner size="lg"/>
        </div>
      } @else if (projects.error()) {
        <p class="text-center text-red-400 py-8">{{ projects.error() }}</p>
      } @else if (projects.projects().length === 0) {
        <app-empty-state [message]="'projects.empty' | translate"/>
      } @else {
        <!-- Grid con líneas separadoras editoriales -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-surface-700">
          @for (project of projects.projects(); track project.id; let i = $index) {
            <article class="bg-surface-900 hover:bg-surface-800 group flex flex-col transition-colors duration-200">

              <!-- Thumbnail -->
              <div class="relative aspect-video bg-surface-800 overflow-hidden">
                <span class="absolute top-3 left-3 font-mono text-xs text-accent-500/50 z-10 tabular-nums">
                  {{ (i + 1).toString().padStart(2, '0') }}
                </span>
                @if (project.thumbnailUrl) {
                  <img
                    [src]="project.thumbnailUrl"
                    [alt]="getTitle(project)"
                    class="w-full h-full object-cover"
                    loading="lazy"
                  />
                } @else {
                  <div class="w-full h-full flex items-center justify-center">
                    <span class="text-7xl font-extrabold text-surface-700 tracking-tighter select-none">
                      {{ getTitle(project).charAt(0) }}
                    </span>
                  </div>
                }
                <!-- Línea dorada animada en hover -->
                <div class="absolute bottom-0 left-0 right-0 h-px bg-accent-500
                            scale-x-0 group-hover:scale-x-100
                            transition-transform duration-300 origin-left"></div>
              </div>

              <!-- Cuerpo de la tarjeta -->
              <div class="p-5 flex flex-col flex-1 border-t border-surface-700">
                <h3 class="text-sm font-bold text-cream-900 mb-2
                           group-hover:text-accent-400 transition-colors leading-tight">
                  {{ getTitle(project) }}
                </h3>
                <p class="text-xs text-cream-900/50 leading-relaxed mb-4 flex-1 line-clamp-3">
                  {{ getDescription(project) }}
                </p>

                <div class="flex flex-wrap gap-1.5 mb-4">
                  @for (techId of project.technologyIds.slice(0, 4); track techId) {
                    <app-tag-badge [label]="getTechName(techId)" color="zinc"/>
                  }
                  @if (project.technologyIds.length > 4) {
                    <app-tag-badge [label]="'+' + (project.technologyIds.length - 4)" color="zinc"/>
                  }
                </div>

                <div class="flex gap-4 pt-3 border-t border-surface-700">
                  <a
                    [routerLink]="['/project', project.slug]"
                    class="font-mono text-[10px] tracking-[0.12em] uppercase text-accent-500 hover:text-accent-400 transition-colors"
                  >
                    Ver detalle →
                  </a>
                  @if (project.demoUrl) {
                    <a [href]="project.demoUrl" target="_blank" rel="noopener noreferrer"
                       class="font-mono text-[10px] tracking-[0.12em] uppercase text-cream-900/35 hover:text-cream-900/75 transition-colors">
                      Demo ↗
                    </a>
                  }
                  @if (project.repositoryUrl) {
                    <a [href]="project.repositoryUrl" target="_blank" rel="noopener noreferrer"
                       class="font-mono text-[10px] tracking-[0.12em] uppercase text-cream-900/35 hover:text-cream-900/75 transition-colors">
                      Code ↗
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
    <section class="border-t border-surface-700">
      <div class="section-container py-16 sm:py-24">
        <div class="flex items-end justify-between mb-12">
          <div>
            <span class="section-label">03 / Writing</span>
            <h2 class="section-title mt-2">{{ 'blog.title' | translate }}</h2>
            <p class="section-subtitle">{{ 'blog.subtitle' | translate }}</p>
          </div>
          <a routerLink="/blog" class="hidden sm:flex btn-secondary">Ver todos →</a>
        </div>

        @if (blog.isLoading()) {
          <div class="flex justify-center py-16">
            <app-spinner size="lg"/>
          </div>
        } @else if (blog.posts().length === 0) {
          <app-empty-state [message]="'blog.empty' | translate"/>
        } @else {
          <!-- Tarjetas con borde izquierdo dorado -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
            @for (post of recentPosts(); track post.id) {
              <article
                [routerLink]="['/blog', post.slug]"
                class="group cursor-pointer border-l-2 border-surface-600 hover:border-accent-500
                       pl-4 py-1 transition-all duration-300"
              >
                <div class="flex flex-wrap gap-3 mb-3">
                  @for (tag of post.tags.slice(0, 2); track tag) {
                    <span class="font-mono text-[10px] tracking-[0.2em] uppercase
                                 text-accent-500/55 group-hover:text-accent-500/85 transition-colors">
                      #{{ tag }}
                    </span>
                  }
                </div>
                <h3 class="text-sm font-bold text-cream-900 mb-2
                           group-hover:text-accent-400 transition-colors leading-snug">
                  {{ getBlogTitle(post) }}
                </h3>
                <p class="text-xs text-cream-900/50 line-clamp-2 mb-4 leading-relaxed">
                  {{ getBlogExcerpt(post) }}
                </p>
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

          <div class="sm:hidden mt-8">
            <a routerLink="/blog" class="btn-secondary w-full justify-center">Ver todos los posts</a>
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

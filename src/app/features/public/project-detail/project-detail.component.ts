/**
 * Página de detalle de un proyecto público.
 *
 * Carga el proyecto por su slug desde la URL y muestra:
 *  - Imagen de portada
 *  - Título, descripción larga (en el idioma activo)
 *  - Stack tecnológico
 *  - Links a demo y repositorio
 *  - Botón de volver
 *
 * Maneja los estados: cargando, no encontrado y error genérico.
 */
import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap, catchError, of } from 'rxjs';
import { ProjectsService } from '../../../core/services/projects.service';
import { TechnologiesService } from '../../../core/services/technologies.service';
import { LanguageService } from '../../../core/services/language.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { SpinnerComponent } from '../../../shared/components/spinner.component';
import { TagBadgeComponent } from '../../../shared/components/tag-badge.component';
import { ProjectResponse } from '../../../core/models/api.models';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [RouterLink, TranslatePipe, SpinnerComponent, TagBadgeComponent],
  template: `
    <div class="section-container py-8 sm:py-12">

      <!-- Botón volver -->
      <a
        routerLink="/"
        class="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors mb-8"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        {{ 'projects.back' | translate }}
      </a>

      <!-- Estado: cargando -->
      @if (loading()) {
        <div class="flex justify-center py-24">
          <app-spinner size="lg" />
        </div>
      }

      <!-- Estado: error / no encontrado -->
      @else if (error()) {
        <div class="text-center py-24">
          <p class="text-zinc-400 mb-4">{{ error() }}</p>
          <a routerLink="/" class="btn-primary">{{ 'error.backHome' | translate }}</a>
        </div>
      }

      <!-- Proyecto cargado -->
      @else if (project()) {
        @let p = project()!;

        <article class="max-w-3xl mx-auto">
          <!-- Header -->
          <header class="mb-8">
            <!-- Estado -->
            @if (p.status === 'draft') {
              <span class="badge-draft mb-4 inline-flex">Borrador</span>
            }

            <h1 class="text-4xl sm:text-5xl font-bold text-zinc-100 mb-4">
              {{ getTitle(p) }}
            </h1>
            <p class="text-xl text-zinc-400 leading-relaxed">
              {{ getDescription(p) }}
            </p>

            <!-- Links de acción -->
            <div class="flex flex-wrap gap-4 mt-6">
              @if (p.demoUrl) {
                <a
                  [href]="p.demoUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn-primary"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                  {{ 'projects.viewDemo' | translate }}
                </a>
              }
              @if (p.repositoryUrl) {
                <a
                  [href]="p.repositoryUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn-secondary"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
                  </svg>
                  {{ 'projects.viewCode' | translate }}
                </a>
              }
            </div>
          </header>

          <!-- Thumbnail -->
          @if (p.thumbnailMediaId) {
            <div class="aspect-video rounded-xl overflow-hidden mb-8 bg-zinc-800">
              <div class="w-full h-full flex items-center justify-center">
                <svg class="w-16 h-16 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
            </div>
          }

          <!-- Tecnologías -->
          <div class="card p-5 mb-8">
            <h2 class="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              {{ 'projects.technologies' | translate }}
            </h2>
            <div class="flex flex-wrap gap-2">
              @for (techId of p.technologyIds; track techId) {
                <app-tag-badge
                  [label]="getTechName(techId)"
                  color="indigo"
                />
              }
            </div>
          </div>

          <!-- Descripción larga -->
          <div class="prose prose-invert prose-zinc max-w-none">
            <div
              class="text-zinc-300 leading-relaxed space-y-4"
              [innerHTML]="getLongDescription(p)"
            ></div>
          </div>
        </article>
      }
    </div>
  `,
})
export class ProjectDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly projectsService = inject(ProjectsService);
  readonly techs = inject(TechnologiesService);
  readonly lang = inject(LanguageService);

  readonly project = signal<ProjectResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.techs.load();

    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const slug = params.get('slug') ?? '';
          return this.projectsService.getBySlug(slug).pipe(
            catchError(() => {
              this.error.set('projects.notFound');
              this.loading.set(false);
              return of(null);
            }),
          );
        }),
      )
      .subscribe((data) => {
        this.project.set(data);
        this.loading.set(false);
      });
  }

  getTitle(p: ProjectResponse): string {
    return this.findT(p)?.title ?? p.slug;
  }

  getDescription(p: ProjectResponse): string {
    return this.findT(p)?.description ?? '';
  }

  getLongDescription(p: ProjectResponse): string {
    return this.findT(p)?.longDescription ?? '';
  }

  getTechName(techId: string): string {
    return this.techs.technologies().find(t => t.id === techId)?.name ?? techId;
  }

  private findT(p: ProjectResponse) {
    const lang = this.lang.lang();
    return p.translations.find(t => t.language === lang) ?? p.translations[0];
  }
}

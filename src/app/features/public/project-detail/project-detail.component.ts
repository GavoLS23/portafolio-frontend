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
import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap, catchError, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  templateUrl: './project-detail.component.html',
})
export class ProjectDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly projectsService = inject(ProjectsService);
  private readonly destroyRef = inject(DestroyRef);
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
        takeUntilDestroyed(this.destroyRef),
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

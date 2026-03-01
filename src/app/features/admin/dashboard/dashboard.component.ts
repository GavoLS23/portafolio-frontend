/**
 * Dashboard del panel de administración.
 *
 * Muestra tarjetas de métricas con la cantidad de proyectos, posts,
 * archivos y tecnologías, desglosando publicados vs borradores.
 *
 * Carga los datos al inicializar mediante los servicios compartidos.
 * Los datos se reutilizan si ya fueron cargados previamente (señales).
 */
import { Component, OnInit, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProjectsService } from '../../../core/services/projects.service';
import { BlogService } from '../../../core/services/blog.service';
import { MediaService } from '../../../core/services/media.service';
import { TechnologiesService } from '../../../core/services/technologies.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

interface StatCard {
  labelKey: string;
  value: () => number;
  subLabelKey?: string;
  subValue?: () => number;
  route: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="space-y-8">

      <!-- Encabezado -->
      <div>
        <h1 class="text-2xl font-bold text-zinc-100">
          {{ 'admin.dashboard.title' | translate }}
        </h1>
        <p class="text-zinc-400 mt-1">{{ 'admin.dashboard.welcome' | translate }}</p>
      </div>

      <!-- Tarjetas de estadísticas -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        @for (card of statCards; track card.labelKey) {
          <a
            [routerLink]="card.route"
            class="card p-5 hover:border-zinc-600 transition-colors block group"
          >
            <div class="flex items-start justify-between mb-4">
              <!-- Ícono -->
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center"
                [class]="card.color"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                    [attr.d]="card.icon"
                  />
                </svg>
              </div>
              <!-- Flecha hover -->
              <svg
                class="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 5l7 7-7 7"/>
              </svg>
            </div>

            <!-- Valor principal -->
            <div class="text-3xl font-bold text-zinc-100 mb-1">
              {{ card.value() }}
            </div>

            <!-- Etiqueta -->
            <div class="text-sm font-medium text-zinc-400">
              {{ card.labelKey | translate }}
            </div>

            <!-- Sub-valor (publicados/borradores) -->
            @if (card.subLabelKey && card.subValue) {
              <div class="mt-2 text-xs text-zinc-500">
                {{ card.subValue() }} {{ card.subLabelKey | translate }}
              </div>
            }
          </a>
        }
      </div>

      <!-- Acciones rápidas -->
      <div>
        <h2 class="text-lg font-semibold text-zinc-200 mb-4">Acciones rápidas</h2>
        <div class="flex flex-wrap gap-3">
          <a routerLink="/admin/projects/new" class="btn-primary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Nuevo proyecto
          </a>
          <a routerLink="/admin/blog/new" class="btn-secondary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Nuevo post
          </a>
          <a routerLink="/admin/media" class="btn-secondary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            Subir archivo
          </a>
        </div>
      </div>

      <!-- Estado del sistema -->
      <div class="card p-5">
        <h2 class="text-base font-semibold text-zinc-200 mb-3">Estado del sistema</h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-zinc-400">API Backend</span>
            <span class="ml-auto text-emerald-400">Online</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-zinc-400">Base de datos</span>
            <span class="ml-auto text-emerald-400">Conectada</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
            <span class="text-zinc-400">Almacenamiento S3</span>
            <span class="ml-auto text-amber-400">Dev local</span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly projectsSvc = inject(ProjectsService);
  private readonly blogSvc = inject(BlogService);
  private readonly mediaSvc = inject(MediaService);
  private readonly techsSvc = inject(TechnologiesService);

  readonly publishedProjects = computed(() =>
    this.projectsSvc.projects().filter(p => p.status === 'published').length
  );
  readonly draftProjects = computed(() =>
    this.projectsSvc.projects().filter(p => p.status === 'draft').length
  );
  readonly publishedPosts = computed(() =>
    this.blogSvc.posts().filter(p => p.status === 'published').length
  );

  readonly statCards: StatCard[] = [
    {
      labelKey: 'admin.dashboard.projects',
      value: () => this.projectsSvc.projects().length,
      subLabelKey: 'admin.dashboard.published',
      subValue: () => this.publishedProjects(),
      route: '/admin/projects',
      icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
      color: 'bg-indigo-500/10 text-indigo-400',
    },
    {
      labelKey: 'admin.dashboard.posts',
      value: () => this.blogSvc.posts().length,
      subLabelKey: 'admin.dashboard.published',
      subValue: () => this.publishedPosts(),
      route: '/admin/blog',
      icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z',
      color: 'bg-sky-500/10 text-sky-400',
    },
    {
      labelKey: 'admin.dashboard.media',
      value: () => this.mediaSvc.mediaList().length,
      route: '/admin/media',
      icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
      color: 'bg-emerald-500/10 text-emerald-400',
    },
    {
      labelKey: 'admin.dashboard.technologies',
      value: () => this.techsSvc.technologies().length,
      route: '/admin/technologies',
      icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
      color: 'bg-violet-500/10 text-violet-400',
    },
  ];

  ngOnInit(): void {
    this.projectsSvc.loadAll();
    this.blogSvc.loadAll();
    this.mediaSvc.loadAll();
    this.techsSvc.load();
  }
}

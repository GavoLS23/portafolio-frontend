/**
 * Formulario de creación / edición de proyectos.
 *
 * Modo creación: /admin/projects/new
 * Modo edición:  /admin/projects/:id/edit
 *
 * Campos del formulario:
 *  - Slug (URL amigable, generado automáticamente del título ES)
 *  - Traducciones: título, descripción corta y larga en ES y EN
 *  - URL de demo y repositorio (opcionales)
 *  - Tecnologías (selección múltiple de checkboxes)
 *  - Imagen de portada (thumbnailMediaId, selección de media)
 *  - Estado (draft / published)
 *
 * Autoguardado: cuando se está editando un proyecto existente, los cambios
 * se envían via WebSocket cada 30 segundos o al salir del campo.
 *
 * Validación: Reactive Forms con Validators estándar de Angular.
 */
import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormArray } from '@angular/forms';
import { ProjectsService } from '../../../core/services/projects.service';
import { TechnologiesService } from '../../../core/services/technologies.service';
import { LanguageService } from '../../../core/services/language.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { SpinnerComponent } from '../../../shared/components/spinner.component';
import { TagBadgeComponent } from '../../../shared/components/tag-badge.component';
import { ProjectResponse, UpdateProjectRequest } from '../../../core/models/api.models';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    SpinnerComponent,
    TagBadgeComponent,
  ],
  template: `
    <div class="max-w-3xl space-y-6">

      <!-- Encabezado -->
      <div class="flex items-center gap-4">
        <a
          routerLink="/admin/projects"
          class="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </a>
        <div>
          <h1 class="text-2xl font-bold text-zinc-100">
            {{ isEdit() ? 'Editar proyecto' : ('admin.projects.new' | translate) }}
          </h1>
          @if (lastSaved()) {
            <p class="text-xs text-emerald-400 mt-0.5">
              Guardado automáticamente a las {{ lastSaved() }}
            </p>
          }
        </div>
      </div>

      <!-- Estado de carga (modo edición) -->
      @if (loading()) {
        <div class="flex justify-center py-16">
          <app-spinner size="lg" />
        </div>
      } @else {

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate class="space-y-6">

          <!-- ── Sección: Info básica ──────────────────────────────────── -->
          <div class="card p-6 space-y-4">
            <h2 class="text-base font-semibold text-zinc-200 border-b border-zinc-700 pb-2">
              Información básica
            </h2>

            <!-- Slug -->
            <div>
              <label class="form-label">{{ 'admin.projects.slug' | translate }}</label>
              <div class="flex items-center gap-2">
                <span class="text-zinc-500 text-sm">/project/</span>
                <input
                  type="text"
                  formControlName="slug"
                  class="form-input flex-1"
                  placeholder="mi-proyecto"
                />
              </div>
              @if (form.controls.slug.invalid && form.controls.slug.touched) {
                <p class="form-error">El slug es requerido.</p>
              }
            </div>

            <!-- URLs opcionales -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="form-label">{{ 'admin.projects.demoUrl' | translate }}</label>
                <input type="url" formControlName="demoUrl" class="form-input" placeholder="https://demo.com" />
              </div>
              <div>
                <label class="form-label">{{ 'admin.projects.repoUrl' | translate }}</label>
                <input type="url" formControlName="repositoryUrl" class="form-input" placeholder="https://github.com/..." />
              </div>
            </div>
          </div>

          <!-- ── Sección: Traducciones ─────────────────────────────────── -->
          <div class="card p-6 space-y-6">
            <h2 class="text-base font-semibold text-zinc-200 border-b border-zinc-700 pb-2">
              Contenido (ES / EN)
            </h2>

            <!-- Tabs de idioma -->
            <div class="flex gap-1 p-1 bg-zinc-900/50 rounded-lg w-fit">
              @for (tab of ['es', 'en']; track tab) {
                <button
                  type="button"
                  class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
                  [class.bg-zinc-700]="activeLang() === tab"
                  [class.text-zinc-100]="activeLang() === tab"
                  [class.text-zinc-400]="activeLang() !== tab"
                  (click)="activeLang.set(tab)"
                >
                  {{ tab.toUpperCase() }}
                </button>
              }
            </div>

            <!-- Español -->
            @if (activeLang() === 'es') {
              <div class="space-y-4" formGroupName="es">
                <div>
                  <label class="form-label">{{ 'admin.projects.title_es' | translate }}</label>
                  <input type="text" formControlName="title" class="form-input"
                    (input)="autoSlug()" placeholder="Mi Proyecto" />
                </div>
                <div>
                  <label class="form-label">{{ 'admin.projects.desc_es' | translate }}</label>
                  <textarea formControlName="description" rows="2" class="form-input resize-none"
                    placeholder="Descripción corta para listados..."></textarea>
                </div>
                <div>
                  <label class="form-label">{{ 'admin.projects.longDesc_es' | translate }}</label>
                  <textarea formControlName="longDescription" rows="6" class="form-input resize-y"
                    placeholder="Descripción larga con detalles del proyecto..."></textarea>
                </div>
              </div>
            }

            <!-- Inglés -->
            @if (activeLang() === 'en') {
              <div class="space-y-4" formGroupName="en">
                <div>
                  <label class="form-label">{{ 'admin.projects.title_en' | translate }}</label>
                  <input type="text" formControlName="title" class="form-input" placeholder="My Project" />
                </div>
                <div>
                  <label class="form-label">{{ 'admin.projects.desc_en' | translate }}</label>
                  <textarea formControlName="description" rows="2" class="form-input resize-none"
                    placeholder="Short description for listings..."></textarea>
                </div>
                <div>
                  <label class="form-label">{{ 'admin.projects.longDesc_en' | translate }}</label>
                  <textarea formControlName="longDescription" rows="6" class="form-input resize-y"
                    placeholder="Long description with project details..."></textarea>
                </div>
              </div>
            }
          </div>

          <!-- ── Sección: Tecnologías ──────────────────────────────────── -->
          <div class="card p-6">
            <h2 class="text-base font-semibold text-zinc-200 border-b border-zinc-700 pb-2 mb-4">
              {{ 'admin.projects.technologies' | translate }}
            </h2>

            @if (techsSvc.isLoading()) {
              <app-spinner size="sm" />
            } @else {
              <div class="flex flex-wrap gap-2">
                @for (tech of techsSvc.technologies(); track tech.id) {
                  <button
                    type="button"
                    class="transition-all"
                    (click)="toggleTech(tech.id)"
                  >
                    <app-tag-badge
                      [label]="tech.name"
                      [color]="isTechSelected(tech.id) ? 'indigo' : 'zinc'"
                    />
                  </button>
                }
              </div>
              @if (techsSvc.technologies().length === 0) {
                <p class="text-sm text-zinc-500">
                  No hay tecnologías. <a routerLink="/admin/technologies" class="text-indigo-400 hover:underline">Crear tecnologías</a>
                </p>
              }
            }
          </div>

          <!-- ── Acciones del formulario ───────────────────────────────── -->
          <div class="flex items-center justify-between pt-2">
            <div class="flex gap-3">
              <button
                type="submit"
                class="btn-primary"
                [disabled]="saving()"
              >
                @if (saving()) {
                  <app-spinner size="sm" />
                  {{ 'admin.projects.saving' | translate }}
                } @else {
                  {{ 'admin.projects.save' | translate }}
                }
              </button>

              @if (isEdit()) {
                <!-- Toggle publicar/despublicar -->
                <button
                  type="button"
                  class="btn-secondary"
                  (click)="toggleStatus()"
                >
                  {{ statusLabel() }}
                </button>
              }
            </div>

            <a routerLink="/admin/projects" class="btn-danger">
              Cancelar
            </a>
          </div>

          <!-- Error de guardado -->
          @if (saveError()) {
            <div class="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p class="text-sm text-red-400">{{ saveError() }}</p>
            </div>
          }
        </form>
      }
    </div>
  `,
})
export class ProjectFormComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly projectsSvc = inject(ProjectsService);
  readonly techsSvc = inject(TechnologiesService);
  readonly lang = inject(LanguageService);
  private readonly ws = inject(WebSocketService);

  readonly isEdit = signal(false);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly lastSaved = signal<string | null>(null);
  readonly activeLang = signal<string>('es');

  private projectId = signal<string | null>(null);
  private selectedTechIds = signal<string[]>([]);

  /** Label del botón de publicación según estado actual */
  readonly statusLabel = computed(() => {
    const p = this.currentProject.get(this.projectId() ?? '');
    return p?.status === 'published'
      ? 'Despublicar'
      : 'Publicar';
  });

  private currentProject = new Map<string, ProjectResponse>();

  private autosaveTimer: ReturnType<typeof setInterval> | null = null;

  readonly form = this.fb.nonNullable.group({
    slug: ['', Validators.required],
    demoUrl: [''],
    repositoryUrl: [''],
    es: this.fb.nonNullable.group({
      title:           [''],
      description:     [''],
      longDescription: [''],
    }),
    en: this.fb.nonNullable.group({
      title:           [''],
      description:     [''],
      longDescription: [''],
    }),
  });

  ngOnInit(): void {
    this.techsSvc.load();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.projectId.set(id);
      this.loadProject(id);
      this.setupAutosave(id);
    }
  }

  ngOnDestroy(): void {
    if (this.autosaveTimer) clearInterval(this.autosaveTimer);
  }

  /** Genera el slug automáticamente del título ES */
  autoSlug(): void {
    const title = this.form.controls.es.controls.title.value;
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    this.form.controls.slug.setValue(slug, { emitEvent: false });
  }

  toggleTech(id: string): void {
    this.selectedTechIds.update(ids =>
      ids.includes(id) ? ids.filter(t => t !== id) : [...ids, id],
    );
  }

  isTechSelected(id: string): boolean {
    return this.selectedTechIds().includes(id);
  }

  toggleStatus(): void {
    const id = this.projectId();
    if (!id) return;
    const project = this.currentProject.get(id);
    if (!project) return;

    const newStatus = project.status === 'published' ? 'draft' : 'published';
    this.projectsSvc.update(id, { status: newStatus }).subscribe({
      next: (updated) => {
        this.currentProject.set(id, updated);
        this.projectsSvc.updateLocal(updated);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.saveError.set(null);

    const value = this.form.getRawValue();
    const payload = {
      slug: value.slug,
      demoUrl: value.demoUrl || null,
      repositoryUrl: value.repositoryUrl || null,
      translations: [
        { language: 'es' as const, ...value.es },
        { language: 'en' as const, ...value.en },
      ],
      technologyIds: this.selectedTechIds(),
    };

    const id = this.projectId();
    const request$ = id
      ? this.projectsSvc.update(id, payload)
      : this.projectsSvc.create(payload);

    request$.subscribe({
      next: (project) => {
        this.saving.set(false);
        if (!id) {
          this.projectsSvc.addLocal(project);
        } else {
          this.projectsSvc.updateLocal(project);
        }
        this.router.navigate(['/admin/projects']);
      },
      error: () => {
        this.saving.set(false);
        this.saveError.set('Error al guardar el proyecto. Intenta de nuevo.');
      },
    });
  }

  // ── Privado ───────────────────────────────────────────────────────────────

  private loadProject(id: string): void {
    this.loading.set(true);
    // Buscar en los proyectos ya cargados
    const existing = this.projectsSvc.projects().find(p => p.id === id);
    if (existing) {
      this.patchForm(existing);
      this.loading.set(false);
    } else {
      this.projectsSvc.loadAll();
      // En producción se haría un GET /admin/projects/:id
      this.loading.set(false);
    }
  }

  private patchForm(p: ProjectResponse): void {
    this.currentProject.set(p.id, p);
    const esT = p.translations.find(t => t.language === 'es');
    const enT = p.translations.find(t => t.language === 'en');

    this.form.patchValue({
      slug: p.slug,
      demoUrl: p.demoUrl ?? '',
      repositoryUrl: p.repositoryUrl ?? '',
      es: { title: esT?.title ?? '', description: esT?.description ?? '', longDescription: esT?.longDescription ?? '' },
      en: { title: enT?.title ?? '', description: enT?.description ?? '', longDescription: enT?.longDescription ?? '' },
    });
    this.selectedTechIds.set(p.technologyIds);
  }

  /** Configura el autoguardado via WebSocket cada 30 segundos */
  private setupAutosave(id: string): void {
    this.autosaveTimer = setInterval(() => {
      if (this.form.dirty) {
        const value = this.form.getRawValue();
        this.ws.sendAutosave({
          type: 'autosave',
          entityId: id,
          data: {
            slug: value.slug,
            translations: [
              { language: 'es', ...value.es },
              { language: 'en', ...value.en },
            ],
            technologyIds: this.selectedTechIds(),
          },
        });
      }
    }, 30_000);

    // Actualizar lastSaved cuando llegue ack del servidor
    // (en producción: suscribirse a ws.lastAutosaveAck)
  }
}

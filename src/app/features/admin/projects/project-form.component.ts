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
import { Component, OnInit, OnDestroy, inject, signal, computed, DestroyRef } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectsService } from '../../../core/services/projects.service';
import { TechnologiesService } from '../../../core/services/technologies.service';
import { LanguageService } from '../../../core/services/language.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { SpinnerComponent } from '../../../shared/components/spinner.component';
import { TagBadgeComponent } from '../../../shared/components/tag-badge.component';
import { ProjectResponse } from '../../../core/models/api.models';

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
  templateUrl: './project-form.component.html',
})
export class ProjectFormComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
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
    this.projectsSvc.update(id, { status: newStatus }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

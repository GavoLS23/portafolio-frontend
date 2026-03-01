/**
 * Formulario de creación / edición de posts de blog.
 *
 * Modo creación: /admin/blog/new
 * Modo edición:  /admin/blog/:id/edit
 *
 * El editor de contenido usa un <textarea> en esta versión del prototipo.
 * TODO: Reemplazar el textarea de contenido con el componente TipTap
 *       cuando se integre @tiptap/core y @tiptap/starter-kit.
 *
 * Autoguardado via WebSocket idéntico al formulario de proyectos.
 */
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BlogService } from '../../../core/services/blog.service';
import { LanguageService } from '../../../core/services/language.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { SpinnerComponent } from '../../../shared/components/spinner.component';
import { TagBadgeComponent } from '../../../shared/components/tag-badge.component';
import { BlogPostResponse } from '../../../core/models/api.models';

@Component({
  selector: 'app-blog-form',
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
        <a routerLink="/admin/blog"
          class="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </a>
        <h1 class="text-2xl font-bold text-zinc-100">
          {{ isEdit() ? 'Editar post' : ('admin.blog.new' | translate) }}
        </h1>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-16"><app-spinner size="lg" /></div>
      } @else {

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate class="space-y-6">

          <!-- Info básica -->
          <div class="card p-6 space-y-4">
            <h2 class="text-base font-semibold text-zinc-200 border-b border-zinc-700 pb-2">
              Información básica
            </h2>

            <!-- Slug -->
            <div>
              <label class="form-label">{{ 'admin.blog.slug' | translate }}</label>
              <div class="flex items-center gap-2">
                <span class="text-zinc-500 text-sm">/blog/</span>
                <input type="text" formControlName="slug" class="form-input flex-1" placeholder="mi-primer-post" />
              </div>
            </div>

            <!-- Tags -->
            <div>
              <label class="form-label">{{ 'admin.blog.tags' | translate }}</label>
              <input type="text" formControlName="tags" class="form-input" placeholder="scala, backend, funcional" />
              <!-- Preview de tags -->
              <div class="flex flex-wrap gap-1.5 mt-2">
                @for (tag of parsedTags(); track tag) {
                  <app-tag-badge [label]="tag" color="indigo" />
                }
              </div>
            </div>
          </div>

          <!-- Contenido multilingüe -->
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
                >{{ tab.toUpperCase() }}</button>
              }
            </div>

            <!-- Campos según idioma activo -->
            @if (activeLang() === 'es') {
              <div class="space-y-4" formGroupName="es">
                <div>
                  <label class="form-label">{{ 'admin.blog.title_es' | translate }}</label>
                  <input type="text" formControlName="title" class="form-input"
                    placeholder="Título del post" (input)="autoSlug()" />
                </div>
                <div>
                  <label class="form-label">{{ 'admin.blog.excerpt_es' | translate }}</label>
                  <textarea formControlName="excerpt" rows="2" class="form-input resize-none"
                    placeholder="Resumen corto del post..."></textarea>
                </div>
                <div>
                  <label class="form-label">
                    {{ 'admin.blog.content_es' | translate }}
                    <span class="ml-2 text-xs text-zinc-500 font-normal">HTML / Markdown</span>
                  </label>
                  <!-- TODO: Reemplazar por editor TipTap -->
                  <textarea
                    formControlName="content"
                    rows="14"
                    class="form-input resize-y font-mono text-xs"
                    placeholder="<p>Contenido del post en HTML...</p>"
                  ></textarea>
                </div>
              </div>
            }

            @if (activeLang() === 'en') {
              <div class="space-y-4" formGroupName="en">
                <div>
                  <label class="form-label">{{ 'admin.blog.title_en' | translate }}</label>
                  <input type="text" formControlName="title" class="form-input" placeholder="Post title" />
                </div>
                <div>
                  <label class="form-label">{{ 'admin.blog.excerpt_en' | translate }}</label>
                  <textarea formControlName="excerpt" rows="2" class="form-input resize-none"
                    placeholder="Short summary of the post..."></textarea>
                </div>
                <div>
                  <label class="form-label">
                    {{ 'admin.blog.content_en' | translate }}
                    <span class="ml-2 text-xs text-zinc-500 font-normal">HTML / Markdown</span>
                  </label>
                  <textarea
                    formControlName="content"
                    rows="14"
                    class="form-input resize-y font-mono text-xs"
                    placeholder="<p>Post content in HTML...</p>"
                  ></textarea>
                </div>
              </div>
            }
          </div>

          <!-- Acciones -->
          <div class="flex items-center justify-between pt-2">
            <div class="flex gap-3">
              <button type="submit" class="btn-primary" [disabled]="saving()">
                @if (saving()) {
                  <app-spinner size="sm" />
                  {{ 'admin.blog.saving' | translate }}
                } @else {
                  {{ 'admin.blog.save' | translate }}
                }
              </button>
            </div>
            <a routerLink="/admin/blog" class="btn-danger">Cancelar</a>
          </div>

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
export class BlogFormComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly blogSvc = inject(BlogService);
  readonly lang = inject(LanguageService);
  private readonly ws = inject(WebSocketService);

  readonly isEdit = signal(false);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly activeLang = signal<string>('es');

  private postId = signal<string | null>(null);
  private autosaveTimer: ReturnType<typeof setInterval> | null = null;

  readonly form = this.fb.nonNullable.group({
    slug: ['', Validators.required],
    tags: [''],
    es: this.fb.nonNullable.group({
      title:   [''],
      excerpt: [''],
      content: [''],
    }),
    en: this.fb.nonNullable.group({
      title:   [''],
      excerpt: [''],
      content: [''],
    }),
  });

  /** Convierte el string de tags a un array (para la preview) */
  parsedTags(): string[] {
    return this.form.controls.tags.value
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.postId.set(id);
      this.loadPost(id);
      this.setupAutosave(id);
    }
  }

  ngOnDestroy(): void {
    if (this.autosaveTimer) clearInterval(this.autosaveTimer);
  }

  autoSlug(): void {
    const title = this.form.controls.es.controls.title.value;
    const slug = title
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    this.form.controls.slug.setValue(slug, { emitEvent: false });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.saving.set(true);
    this.saveError.set(null);

    const value = this.form.getRawValue();
    const payload = {
      slug: value.slug,
      translations: [
        { language: 'es' as const, ...value.es },
        { language: 'en' as const, ...value.en },
      ],
      tags: this.parsedTags(),
    };

    const id = this.postId();
    const request$ = id
      ? this.blogSvc.update(id, payload)
      : this.blogSvc.create(payload);

    request$.subscribe({
      next: (post) => {
        this.saving.set(false);
        id ? this.blogSvc.updateLocal(post) : this.blogSvc.addLocal(post);
        this.router.navigate(['/admin/blog']);
      },
      error: () => {
        this.saving.set(false);
        this.saveError.set('Error al guardar el post. Intenta de nuevo.');
      },
    });
  }

  private loadPost(id: string): void {
    const existing = this.blogSvc.posts().find(p => p.id === id);
    if (existing) this.patchForm(existing);
  }

  private patchForm(p: BlogPostResponse): void {
    const esT = p.translations.find(t => t.language === 'es');
    const enT = p.translations.find(t => t.language === 'en');
    this.form.patchValue({
      slug: p.slug,
      tags: p.tags.join(', '),
      es: { title: esT?.title ?? '', excerpt: esT?.excerpt ?? '', content: esT?.content ?? '' },
      en: { title: enT?.title ?? '', excerpt: enT?.excerpt ?? '', content: enT?.content ?? '' },
    });
  }

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
            tags: this.parsedTags(),
          },
        });
      }
    }, 30_000);
  }
}

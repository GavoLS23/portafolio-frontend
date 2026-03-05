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
import { Component, OnInit, OnDestroy, inject, signal, DestroyRef } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  templateUrl: './blog-form.component.html',
})
export class BlogFormComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
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

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (post) => {
        this.saving.set(false);
        if (id) {
          this.blogSvc.updateLocal(post);
        } else {
          this.blogSvc.addLocal(post);
        }
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

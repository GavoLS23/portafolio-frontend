/**
 * Layout principal para las vistas públicas del portafolio.
 *
 * Incluye:
 *  - Navbar responsivo (hamburger en mobile)
 *  - Selector de idioma (ES / EN)
 *  - <router-outlet> para el contenido de la página
 *  - Footer con links y créditos
 *
 * El navbar se colapsa automáticamente al navegar a otra página.
 */
import { Component, signal, inject, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { LanguageService } from '../core/services/language.service';
import { TranslatePipe } from '../shared/pipes/translate.pipe';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  template: `
    <div class="min-h-screen flex flex-col bg-zinc-900 text-zinc-100">

      <!-- ── Navbar ────────────────────────────────────────────────────── -->
      <header
        class="sticky top-0 z-40 border-b border-zinc-800/80 backdrop-blur-md bg-zinc-900/80"
      >
        <nav class="section-container flex items-center justify-between h-16">

          <!-- Logo / nombre -->
          <a
            routerLink="/"
            class="text-lg font-bold text-zinc-100 hover:text-indigo-400 transition-colors"
          >
            &lt;dev /&gt;
          </a>

          <!-- Links desktop -->
          <div class="hidden md:flex items-center gap-6">
            <a
              routerLink="/"
              routerLinkActive="text-indigo-400"
              [routerLinkActiveOptions]="{ exact: true }"
              class="text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              {{ 'nav.home' | translate }}
            </a>
            <a
              routerLink="/blog"
              routerLinkActive="text-indigo-400"
              class="text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              {{ 'nav.blog' | translate }}
            </a>

            <!-- Separador -->
            <span class="w-px h-4 bg-zinc-700"></span>

            <!-- Botón de idioma -->
            <button
              type="button"
              class="text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
              (click)="langService.toggleLang()"
              [attr.aria-label]="'Cambiar idioma a ' + ('lang.switch' | translate)"
            >
              {{ 'lang.current' | translate }}
            </button>
          </div>

          <!-- Botón hamburger (mobile) -->
          <button
            type="button"
            class="md:hidden p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            (click)="menuOpen.set(!menuOpen())"
            [attr.aria-expanded]="menuOpen()"
            aria-label="Abrir menú"
          >
            @if (menuOpen()) {
              <!-- X icon -->
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            } @else {
              <!-- Hamburger icon -->
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            }
          </button>
        </nav>

        <!-- Menú mobile -->
        @if (menuOpen()) {
          <div class="md:hidden border-t border-zinc-800 px-4 pb-4 pt-2 flex flex-col gap-1 animate-fade-in">
            <a
              routerLink="/"
              routerLinkActive="text-indigo-400 bg-zinc-800"
              [routerLinkActiveOptions]="{ exact: true }"
              class="px-3 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              (click)="menuOpen.set(false)"
            >
              {{ 'nav.home' | translate }}
            </a>
            <a
              routerLink="/blog"
              routerLinkActive="text-indigo-400 bg-zinc-800"
              class="px-3 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              (click)="menuOpen.set(false)"
            >
              {{ 'nav.blog' | translate }}
            </a>
            <div class="h-px bg-zinc-800 my-1"></div>
            <button
              type="button"
              class="px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors text-left"
              (click)="langService.toggleLang(); menuOpen.set(false)"
            >
              {{ 'lang.switch' | translate }} → cambiar idioma
            </button>
          </div>
        }
      </header>

      <!-- ── Contenido de la página ─────────────────────────────────────── -->
      <main class="flex-1">
        <router-outlet />
      </main>

      <!-- ── Footer ─────────────────────────────────────────────────────── -->
      <footer class="border-t border-zinc-800 mt-16">
        <div class="section-container py-8">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p class="text-sm text-zinc-500">
              &copy; {{ year }} — {{ 'footer.rights' | translate }}
            </p>
            <p class="text-sm text-zinc-600">
              {{ 'footer.builtWith' | translate }}
              <span class="text-indigo-500">Angular</span> &
              <span class="text-indigo-500">Scala</span>
            </p>
          </div>
        </div>
      </footer>

    </div>
  `,
})
export class PublicLayoutComponent {
  readonly langService = inject(LanguageService);
  readonly menuOpen = signal(false);
  readonly year = new Date().getFullYear();
}

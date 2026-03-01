/**
 * Layout para el panel de administración.
 *
 * Incluye:
 *  - Sidebar de navegación con links al CRUD de cada entidad
 *  - Topbar con nombre de usuario y botón de logout
 *  - Sidebar colapsable en mobile (overlay + drawer)
 *  - Indicador de estado de conexión WebSocket
 *  - <router-outlet> para el contenido del panel
 *
 * Al montar el layout, establece la conexión WebSocket.
 * Al desmontarlo (logout), la cierra.
 */
import {
  Component,
  signal,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { WebSocketService } from '../core/services/websocket.service';
import { LanguageService } from '../core/services/language.service';
import { TranslatePipe } from '../shared/pipes/translate.pipe';

interface NavItem {
  label: string;   // Clave de traducción
  path: string;
  icon: string;    // SVG path data
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  template: `
    <div class="min-h-screen bg-zinc-900 text-zinc-100 flex">

      <!-- ── Overlay mobile (backdrop del sidebar) ──────────────────────── -->
      @if (sidebarOpen()) {
        <div
          class="fixed inset-0 z-30 bg-black/60 md:hidden"
          (click)="sidebarOpen.set(false)"
        ></div>
      }

      <!-- ── Sidebar ────────────────────────────────────────────────────── -->
      <aside
        class="fixed inset-y-0 left-0 z-40 w-60 bg-zinc-950 border-r border-zinc-800
               flex flex-col transition-transform duration-200 ease-in-out
               md:translate-x-0"
        [class.-translate-x-full]="!sidebarOpen()"
        [class.translate-x-0]="sidebarOpen()"
      >
        <!-- Logo -->
        <div class="h-16 flex items-center px-5 border-b border-zinc-800 flex-shrink-0">
          <span class="text-lg font-bold text-indigo-400">&lt;admin /&gt;</span>
        </div>

        <!-- Navegación -->
        <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          @for (item of navItems; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
              [routerLinkActiveOptions]="{ exact: item.path === '/admin/dashboard' }"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                     text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors
                     border border-transparent"
              (click)="sidebarOpen.set(false)"
            >
              <!-- Ícono SVG -->
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" [attr.d]="item.icon" />
              </svg>
              {{ item.label | translate }}
            </a>
          }
        </nav>

        <!-- Indicador WS + footer del sidebar -->
        <div class="p-4 border-t border-zinc-800 space-y-3">
          <!-- Estado WebSocket -->
          <div class="flex items-center gap-2">
            <span
              class="w-2 h-2 rounded-full flex-shrink-0"
              [class.bg-emerald-400]="ws.isConnected()"
              [class.bg-zinc-600]="!ws.isConnected()"
            ></span>
            <span class="text-xs text-zinc-500">
              {{ ws.isConnected() ? 'WebSocket activo' : 'Sin conexión WS' }}
            </span>
          </div>

          <!-- Link al sitio público -->
          <a
            routerLink="/"
            target="_blank"
            class="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
            {{ 'admin.nav.viewSite' | translate }}
          </a>
        </div>
      </aside>

      <!-- ── Área principal ─────────────────────────────────────────────── -->
      <div class="flex-1 flex flex-col md:ml-60">

        <!-- Topbar -->
        <header class="sticky top-0 z-20 h-16 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-4 sm:px-6">
          <!-- Botón hamburger (mobile) -->
          <button
            type="button"
            class="md:hidden p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            (click)="sidebarOpen.set(!sidebarOpen())"
            aria-label="Abrir sidebar"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>

          <span class="hidden md:block text-sm text-zinc-500">Panel de administración</span>

          <!-- Acciones del topbar -->
          <div class="flex items-center gap-3">
            <!-- Botón de idioma -->
            <button
              type="button"
              class="text-xs font-medium text-zinc-500 hover:text-zinc-100 transition-colors"
              (click)="langService.toggleLang()"
            >
              {{ 'lang.switch' | translate }}
            </button>

            <!-- Logout -->
            <button
              type="button"
              class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400
                     hover:text-red-400 hover:bg-red-500/5 border border-transparent
                     hover:border-red-500/20 transition-colors"
              (click)="auth.logout()"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              <span class="hidden sm:inline">{{ 'admin.nav.logout' | translate }}</span>
            </button>
          </div>
        </header>

        <!-- Contenido de la página admin -->
        <main class="flex-1 p-4 sm:p-6 lg:p-8">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  readonly ws = inject(WebSocketService);
  readonly langService = inject(LanguageService);

  readonly sidebarOpen = signal(false);

  /** Items de navegación del sidebar */
  readonly navItems: NavItem[] = [
    {
      label: 'admin.nav.dashboard',
      path: '/admin/dashboard',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    },
    {
      label: 'admin.nav.projects',
      path: '/admin/projects',
      icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    },
    {
      label: 'admin.nav.blog',
      path: '/admin/blog',
      icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z',
    },
    {
      label: 'admin.nav.media',
      path: '/admin/media',
      icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    },
    {
      label: 'admin.nav.technologies',
      path: '/admin/technologies',
      icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    },
  ];

  ngOnInit(): void {
    // Establece la conexión WebSocket al entrar al panel admin
    this.ws.connect();
  }

  ngOnDestroy(): void {
    // Cierra la conexión al salir (e.g. logout)
    this.ws.disconnect();
  }
}

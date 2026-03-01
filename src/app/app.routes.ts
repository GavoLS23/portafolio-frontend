/**
 * Configuración de rutas raíz de la aplicación.
 *
 * Arquitectura de rutas:
 *
 *  /                    → Vista pública (PublicLayoutComponent como shell)
 *  /project/:slug       → Detalle de proyecto
 *  /blog                → Listado de blog
 *  /blog/:slug          → Detalle de post
 *
 *  /admin               → Panel admin (AdminLayoutComponent como shell, authGuard)
 *  /admin/login         → Login (sin authGuard)
 *  /admin/dashboard     → Dashboard
 *  /admin/projects      → Lista de proyectos + drag & drop
 *  /admin/projects/new  → Formulario de creación
 *  /admin/projects/:id/edit → Formulario de edición
 *  /admin/blog          → Lista de posts
 *  /admin/blog/new      → Formulario de creación
 *  /admin/blog/:id/edit → Formulario de edición
 *  /admin/media         → Biblioteca de medios
 *  /admin/technologies  → Gestión de tecnologías
 *
 *  **                   → Redirección a /
 *
 * Todos los componentes de feature se cargan de forma diferida (lazy)
 * para minimizar el bundle inicial.
 */
import { Routes } from '@angular/router';

export const routes: Routes = [
  // ── Vista pública ──────────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./layout/public-layout.component').then(m => m.PublicLayoutComponent),
    loadChildren: () =>
      import('./features/public/public.routes').then(m => m.publicRoutes),
  },

  // ── Panel admin ────────────────────────────────────────────────────────
  {
    path: 'admin',
    loadChildren: () =>
      import('./features/admin/admin.routes').then(m => m.adminRoutes),
  },

  // ── Catch-all: redirigir rutas desconocidas al home ────────────────────
  {
    path: '**',
    redirectTo: '',
  },
];

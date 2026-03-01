/**
 * Rutas del panel de administración.
 *
 * Todas las rutas (excepto login) están protegidas por authGuard.
 * Los componentes se cargan de forma diferida (lazy) para reducir
 * el bundle inicial de la aplicación.
 *
 * IMPORTANTE: La ruta /admin/projects/reorder (del backend) debe
 * declararse antes que /admin/projects/:id/edit para evitar que
 * "reorder" sea interpretado como un ID. En el frontend no tenemos
 * esta ruta específica, pero sí seguimos el mismo principio con
 * /admin/projects/new antes de /admin/projects/:id/edit.
 */
import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const adminRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.component').then(m => m.LoginComponent),
    title: 'Login — Admin',
  },
  {
    // Layout del admin — protegido con authGuard
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../../layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Dashboard — Admin',
      },

      // ── Proyectos ──────────────────────────────────────────────────────
      {
        path: 'projects',
        loadComponent: () =>
          import('./projects/projects-list.component').then(m => m.ProjectsListComponent),
        title: 'Proyectos — Admin',
      },
      {
        // /new ANTES de /:id/edit (evitar colisión de rutas)
        path: 'projects/new',
        loadComponent: () =>
          import('./projects/project-form.component').then(m => m.ProjectFormComponent),
        title: 'Nuevo proyecto — Admin',
      },
      {
        path: 'projects/:id/edit',
        loadComponent: () =>
          import('./projects/project-form.component').then(m => m.ProjectFormComponent),
        title: 'Editar proyecto — Admin',
      },

      // ── Blog ──────────────────────────────────────────────────────────
      {
        path: 'blog',
        loadComponent: () =>
          import('./blog/admin-blog-list.component').then(m => m.AdminBlogListComponent),
        title: 'Blog — Admin',
      },
      {
        path: 'blog/new',
        loadComponent: () =>
          import('./blog/blog-form.component').then(m => m.BlogFormComponent),
        title: 'Nuevo post — Admin',
      },
      {
        path: 'blog/:id/edit',
        loadComponent: () =>
          import('./blog/blog-form.component').then(m => m.BlogFormComponent),
        title: 'Editar post — Admin',
      },

      // ── Media ─────────────────────────────────────────────────────────
      {
        path: 'media',
        loadComponent: () =>
          import('./media/media-library.component').then(m => m.MediaLibraryComponent),
        title: 'Medios — Admin',
      },

      // ── Tecnologías ───────────────────────────────────────────────────
      {
        path: 'technologies',
        loadComponent: () =>
          import('./technologies/technologies.component').then(m => m.TechnologiesComponent),
        title: 'Tecnologías — Admin',
      },

      // Redirige /admin a /admin/dashboard
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
];

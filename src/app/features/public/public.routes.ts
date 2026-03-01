/**
 * Rutas públicas del portafolio.
 *
 * Todas las rutas públicas usan PublicLayoutComponent como shell.
 * Los componentes de página se cargan de forma diferida (lazy) para
 * mejorar el tiempo de carga inicial.
 */
import { Routes } from '@angular/router';

export const publicRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./home/home.component').then(m => m.HomeComponent),
    title: 'Portafolio',
  },
  {
    path: 'project/:slug',
    loadComponent: () =>
      import('./project-detail/project-detail.component').then(m => m.ProjectDetailComponent),
    title: 'Proyecto — Portafolio',
  },
  {
    path: 'blog',
    loadComponent: () =>
      import('./blog-list/blog-list.component').then(m => m.BlogListComponent),
    title: 'Blog — Portafolio',
  },
  {
    path: 'blog/:slug',
    loadComponent: () =>
      import('./blog-detail/blog-detail.component').then(m => m.BlogDetailComponent),
    title: 'Post — Blog',
  },
];

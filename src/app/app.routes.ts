import { Routes } from '@angular/router';

export const routes: Routes = [
  // ── Vista pública (raíz "/") — shell con navbar + footer ──────────────
  {
    path: '',
    loadComponent: () =>
      import('./layout/public-layout.component').then(m => m.PublicLayoutComponent),
    loadChildren: () =>
      import('./features/public/public.routes').then(m => m.publicRoutes),
  },

  // ── Panel de administración ("/admin") ────────────────────────────────
  {
    path: 'admin',
    loadChildren: () =>
      import('./features/admin/admin.routes').then(m => m.adminRoutes),
  },

  // ── Fallback ──────────────────────────────────────────────────────────
  { path: '**', redirectTo: '' },
];

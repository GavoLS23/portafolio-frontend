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
import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { LanguageService } from '../core/services/language.service';
import { TranslatePipe } from '../shared/pipes/translate.pipe';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './public-layout.component.html',
})
export class PublicLayoutComponent {
  readonly langService = inject(LanguageService);
  readonly menuOpen = signal(false);
  readonly year = new Date().getFullYear();
}

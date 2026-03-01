/**
 * Componente raíz de la aplicación.
 *
 * Es el punto de entrada del árbol de componentes Angular.
 * Solo renderiza <router-outlet> — todo el layout está delegado
 * a PublicLayoutComponent y AdminLayoutComponent según la ruta.
 *
 * Selector: <app-root> (registrado en src/index.html)
 */
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App {}

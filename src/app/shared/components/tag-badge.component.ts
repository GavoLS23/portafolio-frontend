/**
 * Badge/chip para mostrar tecnologías, tags o etiquetas.
 *
 * Inputs:
 *  - label: string        - Texto del badge
 *  - color: string        - Variante de color: 'indigo' | 'zinc' | 'emerald' | 'sky' (default: 'zinc')
 *  - iconUrl: string|null - URL de ícono SVG opcional (para tecnologías)
 *
 * Uso:
 *  <app-tag-badge label="Scala" />
 *  <app-tag-badge label="Angular" color="indigo" [iconUrl]="tech.iconUrl" />
 */
import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';

type BadgeColor = 'indigo' | 'zinc' | 'emerald' | 'sky' | 'amber' | 'rose';

@Component({
  selector: 'app-tag-badge',
  standalone: true,
  imports: [NgClass],
  template: `
    <span
      class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border"
      [ngClass]="colorClasses()"
    >
      @if (iconUrl()) {
        <img
          [src]="iconUrl()"
          [alt]="label()"
          class="w-3.5 h-3.5 object-contain"
        />
      }
      {{ label() }}
    </span>
  `,
})
export class TagBadgeComponent {
  readonly label = input.required<string>();
  readonly color = input<BadgeColor>('zinc');
  readonly iconUrl = input<string | null>(null);

  colorClasses(): string {
    const map: Record<BadgeColor, string> = {
      indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      zinc:   'bg-zinc-700/50   text-zinc-300   border-zinc-600/30',
      emerald:'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      sky:    'bg-sky-500/10    text-sky-400    border-sky-500/20',
      amber:  'bg-amber-500/10  text-amber-400  border-amber-500/20',
      rose:   'bg-rose-500/10   text-rose-400   border-rose-500/20',
    };
    return map[this.color()];
  }
}

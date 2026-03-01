/**
 * Pipe de traducción basado en LanguageService.
 *
 * Uso en templates:
 *  {{ 'nav.home' | translate }}
 *
 * El pipe es `pure: false` (impuro) para que Angular lo re-evalúe
 * cuando el idioma cambia, ya que los signals del LanguageService
 * se actualizan sin que el pipe tenga una referencia directa al input.
 *
 * Rendimiento: para un portafolio con pocas traducciones, el overhead
 * de un pipe impuro es despreciable.
 */
import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../../core/services/language.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false, // Necesario para reaccionar a cambios de idioma
})
export class TranslatePipe implements PipeTransform {
  private readonly lang = inject(LanguageService);

  transform(key: string): string {
    return this.lang.t(key);
  }
}

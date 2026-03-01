/**
 * Servicio de internacionalización (i18n).
 *
 * Gestiona el idioma activo y carga los archivos de traducciones
 * desde /i18n/{lang}.json de forma dinámica.
 *
 * Uso en templates:  {{ 'nav.home' | translate }}
 * Uso en TypeScript: this.lang.t('nav.home')
 *
 * Persistencia: el idioma seleccionado se guarda en localStorage
 * para recordarlo entre visitas.
 */
import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Language } from '../models/api.models';

type Translations = Record<string, string>;

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly http = inject(HttpClient);

  /** Idioma activo — persiste en localStorage */
  readonly lang = signal<Language>(this.getStoredLang());

  /** Traducciones cargadas para el idioma activo */
  private readonly translations = signal<Translations>({});

  /** true mientras se cargan las traducciones */
  readonly loading = signal(true);

  constructor() {
    this.loadTranslations(this.lang());
  }

  /**
   * Cambia el idioma activo y recarga las traducciones.
   * Guarda la preferencia en localStorage.
   */
  setLang(lang: Language): void {
    this.lang.set(lang);
    localStorage.setItem('lang', lang);
    this.loadTranslations(lang);
  }

  /** Alterna entre español e inglés */
  toggleLang(): void {
    this.setLang(this.lang() === 'es' ? 'en' : 'es');
  }

  /**
   * Devuelve el texto traducido para la clave dada.
   * Si la clave no existe, devuelve la propia clave como fallback.
   */
  t(key: string): string {
    return this.translations()[key] ?? key;
  }

  /** Señal computada con el texto de la clave (reactiva) */
  translationOf(key: string) {
    return computed(() => this.translations()[key] ?? key);
  }

  // ── Privado ───────────────────────────────────────────────────────────────

  private loadTranslations(lang: Language): void {
    this.loading.set(true);
    this.http
      .get<Translations>(`/i18n/${lang}.json`)
      .subscribe({
        next: (data) => {
          this.translations.set(data);
          this.loading.set(false);
        },
        error: () => {
          // Si falla la carga, dejamos las traducciones vacías
          // y el fallback mostrará las claves directamente.
          this.loading.set(false);
        },
      });
  }

  private getStoredLang(): Language {
    const stored = localStorage.getItem('lang');
    return stored === 'en' ? 'en' : 'es';
  }
}

// services/theme.service.ts
import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'dark' | 'light' | 'dark-rose' | 'light-rose';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  theme = signal<Theme>((localStorage.getItem('sf_theme') as Theme) ?? 'dark');

  constructor() {
    effect(() => {
      const t = this.theme();
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem('sf_theme', t);
    });
    document.documentElement.setAttribute('data-theme', this.theme());
  }

  set(t: Theme) { this.theme.set(t); }

  toggle() {
    // Alterna entre escuro/claro mantendo variante rosa se ativa
    this.theme.update(t => {
      if (t === 'dark')       return 'light';
      if (t === 'light')      return 'dark';
      if (t === 'dark-rose')  return 'light-rose';
      return 'dark-rose';
    });
  }

  isDark()  { return this.theme() === 'dark'  || this.theme() === 'dark-rose'; }
  isRose()  { return this.theme() === 'dark-rose' || this.theme() === 'light-rose'; }
}

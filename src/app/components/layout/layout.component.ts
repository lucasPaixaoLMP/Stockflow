// components/layout/layout.component.ts
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
<div class="app-layout">
  <aside class="sidebar">

    <!-- LOGO AREA -->
    <div class="sb-logo">
      <div class="logo-img-wrap">
        <!--
          PARA USAR SEU LOGO:
          1. Salve em: frontend/src/assets/logo.png
          2. Substitua o bloco abaixo por:
             <img src="assets/logo.png" alt="Logo" class="custom-logo">
        -->
        <div class="logo-placeholder">
          <div class="logo-placeholder-inner">
            <span class="logo-icon">✦</span>
            <span class="logo-placeholder-text">Seu Logo Aqui</span>
          </div>
          <div class="logo-hint">assets/logo.png</div>
        </div>
      </div>
    </div>

    <nav class="sb-nav">
      <div class="nav-group">
        <div class="nav-group-label">Principal</div>
        <a class="nav-item" routerLink="/dashboard" routerLinkActive="active">
          <span class="ni">📊</span> Dashboard
        </a>
        <a class="nav-item" routerLink="/vendas" routerLinkActive="active">
          <span class="ni">🛒</span> Nova Venda
        </a>
        <a class="nav-item" routerLink="/historico" routerLinkActive="active">
          <span class="ni">📋</span> Histórico de Vendas
        </a>
      </div>
      <div class="nav-group">
        <div class="nav-group-label">Estoque</div>
        <a class="nav-item" routerLink="/produtos" routerLinkActive="active">
          <span class="ni">📦</span> Produtos
          @if (lowStockCount() > 0) {
            <span class="nav-badge">{{ lowStockCount() }}</span>
          }
        </a>
        <a class="nav-item" routerLink="/categorias" routerLinkActive="active">
          <span class="ni">🏷️</span> Categorias
        </a>
      </div>
      <div class="nav-group">
        <div class="nav-group-label">Análises</div>
        <a class="nav-item" routerLink="/relatorios" routerLinkActive="active">
          <span class="ni">📈</span> Relatórios
        </a>
        @if (isAdmin()) {
          <a class="nav-item" routerLink="/usuarios" routerLinkActive="active">
            <span class="ni">👥</span> Usuários
          </a>
        }
      </div>
    </nav>

    <div class="sb-footer">
      <!-- Theme toggle -->
      <button class="theme-btn" (click)="theme.toggle()" [title]="theme.theme() === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'">
        <span class="theme-icon">{{ theme.theme() === 'light' ? '🌙' : '☀️' }}</span>
        <span>{{ theme.theme() === 'light' ? 'Modo Escuro' : 'Modo Claro' }}</span>
        <span class="theme-pill">{{ theme.theme() === 'light' ? 'OFF' : 'ON' }}</span>
      </button>

      <div class="user-card">
        <div class="user-av">{{ userInitial() }}</div>
        <div class="user-info">
          <div class="user-name">{{ user()?.name }}</div>
          <div class="user-role">{{ roleLabel() }}</div>
        </div>
      </div>
      <button class="btn-logout" (click)="logout()">⬅ Sair da conta</button>
    </div>
  </aside>

  <main class="main-area">
    <router-outlet />
  </main>
</div>
  `,
  styles: [`
    .app-layout { display: flex; min-height: 100vh; background: var(--bg); }

    .sidebar {
      position: fixed; left: 0; top: 0; bottom: 0;
      width: var(--sidebar-width);
      background: var(--surface); border-right: 1.5px solid var(--border);
      display: flex; flex-direction: column; z-index: 100;
      box-shadow: 2px 0 16px rgba(196,99,122,0.06);
      transition: background 0.3s, border-color 0.3s;
    }

    /* Logo */
    .sb-logo {
      padding: 18px 14px 16px;
      border-bottom: 1.5px solid var(--border);
      background: linear-gradient(160deg, var(--surface), var(--surface2));
    }
    .logo-img-wrap { display: flex; align-items: center; justify-content: center; }

    :host ::ng-deep .custom-logo {
      max-height: 56px; max-width: 200px; width: auto;
      object-fit: contain; display: block;
    }

    .logo-placeholder {
      width: 100%; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 10px 8px;
      border: 2px dashed var(--accent-light);
      border-radius: 14px; background: var(--accent-soft);
      gap: 3px; cursor: default;
    }
    .logo-placeholder-inner { display: flex; align-items: center; gap: 7px; }
    .logo-icon { font-size: 16px; color: var(--accent); }
    .logo-placeholder-text {
      font-family: 'Cormorant Garamond', serif;
      font-weight: 600; font-size: 14px; color: var(--accent);
    }
    .logo-hint { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--text3); }

    /* Nav */
    .sb-nav { flex: 1; padding: 14px 10px; overflow-y: auto; }
    .nav-group { margin-bottom: 22px; }
    .nav-group-label {
      font-size: 10px; font-weight: 700; color: var(--text3);
      text-transform: uppercase; letter-spacing: 1.2px;
      padding: 0 10px; margin-bottom: 6px;
    }
    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 12px; border-radius: 12px;
      color: var(--text2); font-size: 14px; font-weight: 500;
      transition: all 0.16s; margin-bottom: 2px; text-decoration: none;
      &:hover { background: var(--surface2); color: var(--accent); }
      &.active {
        background: var(--accent-soft); color: var(--accent); font-weight: 600;
        box-shadow: inset 3px 0 0 var(--accent);
      }
    }
    .ni { font-size: 16px; width: 20px; text-align: center; }
    .nav-badge {
      margin-left: auto; background: var(--danger); color: #fff;
      font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 20px;
    }

    /* Footer */
    .sb-footer {
      padding: 12px 12px 14px;
      border-top: 1.5px solid var(--border);
      background: var(--surface2);
      display: flex; flex-direction: column; gap: 8px;
    }

    .theme-btn {
      display: flex; align-items: center; gap: 9px;
      width: 100%; padding: 9px 12px;
      background: var(--surface); border: 1.5px solid var(--border);
      border-radius: 12px; cursor: pointer;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 13px; font-weight: 500; color: var(--text2);
      transition: all 0.2s;
      &:hover { border-color: var(--accent-light); color: var(--accent); background: var(--accent-soft); }
    }
    .theme-icon { font-size: 16px; }
    .theme-pill {
      margin-left: auto;
      font-size: 10px; font-weight: 700; font-family: 'DM Mono', monospace;
      padding: 2px 7px; border-radius: 20px;
      background: var(--accent-soft); color: var(--accent);
    }

    .user-card {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 11px; border-radius: 12px;
      background: var(--surface); border: 1.5px solid var(--border);
    }
    .user-av {
      width: 34px; height: 34px; border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), var(--accent-light));
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 14px; color: #fff; flex-shrink: 0;
    }
    .user-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 128px; color: var(--text); }
    .user-role { font-size: 11px; color: var(--text3); margin-top: 1px; }

    .btn-logout {
      width: 100%; background: transparent;
      border: 1.5px solid var(--border); color: var(--text2);
      padding: 8px; border-radius: 10px; cursor: pointer;
      font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif;
      font-weight: 500; transition: all 0.2s;
      &:hover { background: rgba(212,82,110,0.08); color: var(--danger); border-color: rgba(212,82,110,0.3); }
    }

    .main-area { margin-left: var(--sidebar-width); flex: 1; min-width: 0; }
  `]
})
export class LayoutComponent {
  private authSvc = inject(AuthService);
  private api     = inject(ApiService);
  theme = inject(ThemeService);

  user          = this.authSvc.currentUser;
  lowStockCount = signal(0);

  userInitial = computed(() => this.user()?.name?.[0]?.toUpperCase() ?? 'U');
  roleLabel   = computed(() => {
    const map: Record<string, string> = { admin: 'Administrador', vendedor: 'Vendedor' };
    return map[this.user()?.role ?? ''] ?? this.user()?.role ?? '';
  });

  constructor() {
    this.api.getLowStockProducts().subscribe(items => this.lowStockCount.set(items.length));
  }

  isAdmin() { return this.authSvc.isAdmin(); }

  logout() { this.authSvc.logout(); }
}

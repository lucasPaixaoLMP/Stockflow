// components/login/login.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="auth-screen">
  <div class="bg-decor">
    <div class="petal petal1"></div>
    <div class="petal petal2"></div>
    <div class="petal petal3"></div>
  </div>

  <button class="theme-float" (click)="theme.toggle()" [title]="theme.theme() === 'light' ? 'Modo escuro' : 'Modo claro'">
    {{ theme.theme() === 'light' ? '🌙' : '☀️' }}
  </button>

  <div class="auth-card">
    <div class="auth-logo-wrap">
      <!--
        PARA USAR SEU LOGO: substitua por:
        <img src="assets/logo.png" alt="Logo" class="auth-logo-img">
      -->
      <div class="auth-logo-placeholder">
        <span class="logo-symbol">✦</span>
        <span class="logo-name">Seu Logo</span>
      </div>
    </div>

    <div class="auth-divider"></div>
    <p class="auth-sub">Sistema de Gestão de Estoque &amp; Vendas</p>

    @if (fromProtected()) {
      <div class="auth-notice">🔒 Faça login para acessar o sistema</div>
    }

    <div class="form-group">
      <label>Email</label>
      <input type="email" [(ngModel)]="email" placeholder="seu@email.com"
             (keyup.enter)="doLogin()" autocomplete="email">
    </div>
    <div class="form-group">
      <label>Senha</label>
      <div class="pass-wrap">
        <input [type]="showPass() ? 'text' : 'password'" [(ngModel)]="password"
               placeholder="••••••••" (keyup.enter)="doLogin()" autocomplete="current-password">
        <button class="pass-toggle" (click)="togglePass()" type="button">
          {{ showPass() ? '🙈' : '👁' }}
        </button>
      </div>
    </div>

    <div class="hint">Demo: admin&#64;stockflow.com / 123456</div>

    <button class="btn btn-primary btn-full btn-lg" [disabled]="loading()" (click)="doLogin()">
      @if (loading()) {
        <span class="btn-spinner"></span> Verificando...
      } @else {
        🔐 Entrar
      }
    </button>

    @if (error()) {
      <div class="error-box">⚠️ {{ error() }}</div>
    }
  </div>
</div>
  `,
  styles: [`
    .auth-screen {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: var(--bg); position: relative; overflow: hidden; padding: 20px;
      transition: background 0.3s;
    }
    [data-theme="light"] .auth-screen {
      background: linear-gradient(145deg, #fdf0f3 0%, #fef6f8 50%, #fce8f0 100%);
    }
    .bg-decor { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
    .petal { position: absolute; border-radius: 50%; }
    .petal1 { width: 600px; height: 600px; top: -200px; left: -150px; background: radial-gradient(circle, rgba(196,99,122,0.1), transparent 70%); }
    .petal2 { width: 400px; height: 400px; bottom: -100px; right: -100px; background: radial-gradient(circle, rgba(160,120,90,0.07), transparent 70%); }
    .petal3 { width: 300px; height: 300px; top: 40%; left: 60%; background: radial-gradient(circle, rgba(196,99,122,0.06), transparent 70%); }

    .theme-float {
      position: fixed; top: 20px; right: 20px; z-index: 10;
      width: 42px; height: 42px; border-radius: 50%;
      border: 1.5px solid var(--border); background: var(--surface);
      cursor: pointer; font-size: 18px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: var(--shadow-md); transition: all 0.2s;
      &:hover { transform: rotate(20deg) scale(1.1); }
    }

    .auth-card {
      background: var(--surface); border: 1.5px solid var(--border);
      border-radius: 26px; padding: 44px; width: 100%; max-width: 420px;
      position: relative; z-index: 1; box-shadow: var(--shadow-lg);
      transition: background 0.3s, border-color 0.3s;
    }

    .auth-logo-wrap { display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
    :host ::ng-deep .auth-logo-img { max-height: 72px; max-width: 240px; width: auto; object-fit: contain; display: block; }
    .auth-logo-placeholder {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 28px; border: 2px dashed var(--accent-light);
      border-radius: 16px; background: var(--accent-soft);
    }
    .logo-symbol { font-size: 22px; color: var(--accent); }
    .logo-name { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 700; color: var(--accent); }

    .auth-divider { height: 1px; background: linear-gradient(to right, transparent, var(--border), transparent); margin-bottom: 12px; }
    .auth-sub { text-align: center; color: var(--text2); font-size: 13px; margin-bottom: 26px; }

    .auth-notice {
      background: var(--accent-soft); border: 1.5px solid var(--accent-light);
      color: var(--accent); padding: 10px 14px; border-radius: 10px;
      font-size: 13px; text-align: center; margin-bottom: 20px;
    }

    .pass-wrap { position: relative; }
    .pass-toggle {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; font-size: 16px; padding: 4px;
      color: var(--text3); &:hover { color: var(--accent); }
    }
    .pass-wrap input { padding-right: 44px; }

    .hint { color: var(--text3); font-size: 12px; margin-bottom: 16px; text-align: center; }

    .error-box {
      background: rgba(212,82,110,0.08); border: 1.5px solid rgba(212,82,110,0.25);
      color: var(--danger); padding: 10px 14px; border-radius: 10px;
      font-size: 13px; margin-top: 14px; text-align: center;
    }

    .btn-spinner {
      width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #fff; border-radius: 50%;
      animation: spin 0.6s linear infinite; display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class LoginComponent implements OnInit {
  private auth   = inject(AuthService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  theme = inject(ThemeService);

  loading       = signal(false);
  error         = signal('');
  showPass      = signal(false);
  fromProtected = signal(false);

  email    = 'admin@stockflow.com';
  password = '123456';
  private returnUrl = '/dashboard';

  ngOnInit() {
    this.route.queryParams.subscribe(p => {
      if (p['returnUrl']) { this.returnUrl = p['returnUrl']; this.fromProtected.set(true); }
    });
  }

  // Método separado — sem arrow function no template
  togglePass() { this.showPass.set(!this.showPass()); }

  doLogin() {
    this.error.set('');
    if (!this.email.trim() || !this.password) { this.error.set('Preencha email e senha'); return; }
    this.loading.set(true);
    this.auth.login(this.email.trim(), this.password).subscribe({
      next: () => this.router.navigateByUrl(this.returnUrl),
      error: (e) => { this.error.set(e.error?.error || 'Email ou senha incorretos'); this.loading.set(false); }
    });
  }
}

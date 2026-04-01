// components/settings/settings.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ThemeService, Theme } from '../../services/theme.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page-wrap fade-in">
  <div class="page-header">
    <div>
      <div class="page-title">Configurações da Loja</div>
      <div class="page-sub">Personalize a aparência da sua loja</div>
    </div>
    <button class="btn btn-primary" [disabled]="saving()" (click)="save()">
      @if (saving()) { <span class="btn-spin"></span> Salvando... }
      @else { 💾 Salvar Alterações }
    </button>
  </div>

  <div class="settings-grid">

    <!-- Logo -->
    <div class="card">
      <div class="card-header"><span class="card-title">🖼️ Logo da Loja</span></div>
      <div class="card-body">
        <div class="logo-preview-wrap">
          @if (logoPreview()) {
            <div class="logo-preview">
              <img [src]="logoPreview()!" alt="Logo" class="logo-img">
              <button class="btn-remove-logo" (click)="removeLogo()" title="Remover logo">✕</button>
            </div>
            <p class="preview-label">Pré-visualização atual</p>
          } @else {
            <div class="logo-empty">
              <div class="logo-empty-icon">🏪</div>
              <p>Nenhum logo cadastrado</p>
            </div>
          }
        </div>
        <div class="upload-area" (click)="fileInput.click()" (dragover)="onDragOver($event)" (drop)="onDrop($event)" [class.drag-over]="dragging()">
          <input #fileInput type="file" accept="image/*" style="display:none" (change)="onFileChange($event)">
          <div class="upload-icon">📁</div>
          <div class="upload-text">Clique ou arraste sua imagem aqui</div>
          <div class="upload-hint">PNG, JPG, SVG • Recomendado: fundo transparente</div>
        </div>
      </div>
    </div>

    <!-- Nome da loja -->
    <div class="card">
      <div class="card-header"><span class="card-title">🏪 Nome da Loja</span></div>
      <div class="card-body">
        <div class="form-group">
          <label>Nome exibido no sistema</label>
          <input type="text" [(ngModel)]="storeName" placeholder="Ex: Loja da Maria...">
        </div>
        <div class="sidebar-preview">
          <div class="sp-label">Pré-visualização da sidebar</div>
          <div class="sp-box">
            @if (logoPreview()) {
              <img [src]="logoPreview()!" alt="Logo" class="sp-logo">
            } @else {
              <div class="sp-logo-placeholder">✦</div>
            }
            <div class="sp-name">{{ storeName || userName()?.name || 'Sua Loja' }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tema -->
    <div class="card" style="grid-column: 1 / -1;">
      <div class="card-header"><span class="card-title">🎨 Tema da Interface</span></div>
      <div class="card-body">
        <div class="theme-grid">

          <div class="theme-option" [class.active]="theme.theme() === 'dark'" (click)="theme.set('dark')">
            <div class="theme-preview dark-preview">
              <div class="tp-sidebar"></div>
              <div class="tp-main">
                <div class="tp-card"></div>
                <div class="tp-card short"></div>
              </div>
            </div>
            <div class="theme-info">
              <div class="theme-name">🌑 Escuro</div>
              <div class="theme-desc">Padrão — azul/cinza escuro</div>
            </div>
            @if (theme.theme() === 'dark') { <div class="theme-check">✓</div> }
          </div>

          <div class="theme-option" [class.active]="theme.theme() === 'light'" (click)="theme.set('light')">
            <div class="theme-preview light-preview">
              <div class="tp-sidebar"></div>
              <div class="tp-main">
                <div class="tp-card"></div>
                <div class="tp-card short"></div>
              </div>
            </div>
            <div class="theme-info">
              <div class="theme-name">☀️ Claro</div>
              <div class="theme-desc">Neutro — branco/cinza</div>
            </div>
            @if (theme.theme() === 'light') { <div class="theme-check">✓</div> }
          </div>

          <div class="theme-option" [class.active]="theme.theme() === 'dark-rose'" (click)="theme.set('dark-rose')">
            <div class="theme-preview dark-rose-preview">
              <div class="tp-sidebar"></div>
              <div class="tp-main">
                <div class="tp-card"></div>
                <div class="tp-card short"></div>
              </div>
            </div>
            <div class="theme-info">
              <div class="theme-name">🌹 Rosa Escuro</div>
              <div class="theme-desc">Elegante — rosa & preto</div>
            </div>
            @if (theme.theme() === 'dark-rose') { <div class="theme-check">✓</div> }
          </div>

          <div class="theme-option" [class.active]="theme.theme() === 'light-rose'" (click)="theme.set('light-rose')">
            <div class="theme-preview light-rose-preview">
              <div class="tp-sidebar"></div>
              <div class="tp-main">
                <div class="tp-card"></div>
                <div class="tp-card short"></div>
              </div>
            </div>
            <div class="theme-info">
              <div class="theme-name">🌸 Rosa Claro</div>
              <div class="theme-desc">Suave — rosa & branco</div>
            </div>
            @if (theme.theme() === 'light-rose') { <div class="theme-check">✓</div> }
          </div>

        </div>
      </div>
    </div>

  </div>
</div>
  `,
  styles: [`
    .settings-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    @media (max-width: 768px) {
      .settings-grid { grid-template-columns: 1fr; }
    }

    .card-body { padding: 24px; }

    /* Logo */
    .logo-preview-wrap { display: flex; flex-direction: column; align-items: center; margin-bottom: 20px; }
    .logo-preview {
      position: relative; display: inline-block;
      background: repeating-conic-gradient(var(--surface2) 0% 25%, var(--surface) 0% 50%) 0 0 / 16px 16px;
      border-radius: 12px; padding: 16px; border: 1.5px solid var(--border);
    }
    .logo-img { max-height: 80px; max-width: 200px; display: block; object-fit: contain; }
    .btn-remove-logo {
      position: absolute; top: -8px; right: -8px;
      width: 22px; height: 22px; border-radius: 50%;
      background: var(--danger); color: #fff; border: none;
      font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center;
    }
    .preview-label { font-size: 12px; color: var(--text3); margin-top: 8px; }
    .logo-empty {
      width: 100%; padding: 24px; text-align: center;
      background: var(--surface2); border-radius: 12px; border: 1.5px dashed var(--border);
      color: var(--text3); margin-bottom: 16px;
      .logo-empty-icon { font-size: 32px; margin-bottom: 6px; }
      p { font-size: 13px; }
    }
    .upload-area {
      border: 2px dashed var(--accent-light);
      border-radius: 14px; padding: 28px 20px;
      text-align: center; cursor: pointer;
      background: var(--accent-soft);
      transition: all 0.2s;
      &:hover, &.drag-over { border-color: var(--accent); transform: scale(1.01); }
    }
    .upload-icon { font-size: 28px; margin-bottom: 8px; }
    .upload-text { font-size: 14px; font-weight: 600; color: var(--accent); margin-bottom: 4px; }
    .upload-hint { font-size: 12px; color: var(--text3); }

    /* Sidebar preview */
    .sp-label { font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 10px; }
    .sp-box {
      background: var(--surface2); border: 1.5px solid var(--border);
      border-radius: 14px; padding: 16px 20px;
      display: flex; align-items: center; gap: 12px;
    }
    .sp-logo { max-height: 40px; max-width: 120px; object-fit: contain; }
    .sp-logo-placeholder {
      width: 40px; height: 40px; border-radius: 10px;
      background: var(--accent-soft); border: 2px dashed var(--accent-light);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; color: var(--accent);
    }
    .sp-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 17px; font-weight: 700; color: var(--text);
    }

    /* Theme grid */
    .theme-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    @media (max-width: 900px) { .theme-grid { grid-template-columns: 1fr 1fr; } }

    .theme-option {
      border: 2px solid var(--border); border-radius: 16px;
      cursor: pointer; overflow: hidden; position: relative;
      transition: all 0.2s;
      &:hover { border-color: var(--accent-light); transform: translateY(-2px); box-shadow: var(--shadow-md); }
      &.active { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
    }
    .theme-check {
      position: absolute; top: 10px; right: 10px;
      width: 22px; height: 22px; border-radius: 50%;
      background: var(--accent); color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700;
    }
    .theme-info { padding: 12px 14px; }
    .theme-name { font-weight: 700; font-size: 14px; margin-bottom: 3px; }
    .theme-desc { font-size: 12px; color: var(--text3); }

    /* Theme previews */
    .theme-preview {
      height: 90px; display: flex; overflow: hidden;
    }
    .tp-sidebar { width: 30%; }
    .tp-main { flex: 1; padding: 8px; display: flex; flex-direction: column; gap: 6px; }
    .tp-card { border-radius: 6px; height: 30px; }
    .tp-card.short { height: 18px; width: 70%; }

    /* dark */
    .dark-preview { background: #0d0e12; }
    .dark-preview .tp-sidebar { background: #13151c; border-right: 1px solid #272b38; }
    .dark-preview .tp-card { background: #13151c; border: 1px solid #272b38; }

    /* light */
    .light-preview { background: #f4f5f8; }
    .light-preview .tp-sidebar { background: #ffffff; border-right: 1px solid #dde0ea; }
    .light-preview .tp-card { background: #ffffff; border: 1px solid #dde0ea; }

    /* dark-rose */
    .dark-rose-preview { background: #0a0a0f; }
    .dark-rose-preview .tp-sidebar { background: #111118; border-right: 1px solid #2a2a3a; }
    .dark-rose-preview .tp-card { background: #111118; border: 1px solid #2a2a3a; }

    /* light-rose */
    .light-rose-preview { background: #fdf6f8; }
    .light-rose-preview .tp-sidebar { background: #ffffff; border-right: 1px solid #f0d6de; }
    .light-rose-preview .tp-card { background: #ffffff; border: 1px solid #f0d6de; }

    .btn-spin {
      width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #fff; border-radius: 50%;
      animation: spin 0.6s linear infinite; display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class SettingsComponent implements OnInit {
  private http  = inject(HttpClient);
  private auth  = inject(AuthService);
  private toast = inject(ToastService);
  theme = inject(ThemeService);

  saving      = signal(false);
  dragging    = signal(false);
  logoPreview = signal<string | null>(null);
  storeName   = '';
  userName    = this.auth.currentUser;

  ngOnInit() {
    this.http.get<any>('/api/settings').subscribe({
      next: s => {
        this.storeName = s.store_name || '';
        if (s.logo_base64) this.logoPreview.set(s.logo_base64);
      }
    });
  }

  onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.processFile(file);
  }
  onDragOver(e: DragEvent) { e.preventDefault(); this.dragging.set(true); }
  onDrop(e: DragEvent) {
    e.preventDefault(); this.dragging.set(false);
    const file = e.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) this.processFile(file);
  }
  processFile(file: File) {
    if (file.size > 2 * 1024 * 1024) { this.toast.error('Imagem muito grande (máx. 2MB)'); return; }
    const reader = new FileReader();
    reader.onload = (e) => this.logoPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }
  removeLogo() { this.logoPreview.set(null); }

  save() {
    this.saving.set(true);
    this.http.put<any>('/api/settings', {
      store_name:  this.storeName || null,
      logo_base64: this.logoPreview() || null
    }).subscribe({
      next: (user) => {
        this.toast.success('Configurações salvas!');
        this.saving.set(false);
        window.dispatchEvent(new CustomEvent('store-settings-updated', { detail: user }));
      },
      error: (e) => { this.toast.error(e.error?.error || 'Erro ao salvar'); this.saving.set(false); }
    });
  }
}

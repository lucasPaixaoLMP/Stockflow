// components/settings/settings.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

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

        <!-- Preview atual -->
        <div class="logo-preview-wrap">
          @if (logoPreview()) {
            <div class="logo-preview">
              <img [src]="logoPreview()" alt="Logo" class="logo-img">
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

        <!-- Upload -->
        <div class="upload-area" (click)="fileInput.click()" (dragover)="onDragOver($event)" (drop)="onDrop($event)" [class.drag-over]="dragging()">
          <input #fileInput type="file" accept="image/*" style="display:none" (change)="onFileChange($event)">
          <div class="upload-icon">📁</div>
          <div class="upload-text">Clique ou arraste sua imagem aqui</div>
          <div class="upload-hint">PNG, JPG, SVG • Recomendado: fundo transparente (PNG)</div>
        </div>

        @if (logoPreview()) {
          <div class="logo-tips">
            <div class="tip">✅ Logo carregado com sucesso</div>
            <div class="tip-text">Para melhor resultado, use PNG com fundo transparente. O logo aparecerá na sidebar e na tela de login.</div>
          </div>
        }
      </div>
    </div>

    <!-- Nome da loja -->
    <div class="card">
      <div class="card-header"><span class="card-title">🏪 Nome da Loja</span></div>
      <div class="card-body">
        <div class="form-group">
          <label>Nome exibido no sistema</label>
          <input type="text" [(ngModel)]="storeName" placeholder="Ex: Loja da Maria, Mercadinho João...">
        </div>
        <p class="field-hint">Este nome aparece abaixo do logo na sidebar.</p>

        <!-- Prévia da sidebar -->
        <div class="sidebar-preview">
          <div class="sp-label">Pré-visualização da sidebar</div>
          <div class="sp-box">
            @if (logoPreview()) {
              <img [src]="logoPreview()" alt="Logo" class="sp-logo">
            } @else {
              <div class="sp-logo-placeholder">✦</div>
            }
            <div class="sp-name">{{ storeName || userName() }}</div>
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

    /* Logo preview */
    .logo-preview-wrap { display: flex; flex-direction: column; align-items: center; margin-bottom: 20px; }
    .logo-preview {
      position: relative; display: inline-block;
      background: repeating-conic-gradient(#f0d6de 0% 25%, #fdf6f8 0% 50%) 0 0 / 16px 16px;
      border-radius: 12px; padding: 16px; border: 1.5px solid var(--border);
    }
    .logo-img { max-height: 80px; max-width: 200px; display: block; object-fit: contain; }
    .btn-remove-logo {
      position: absolute; top: -8px; right: -8px;
      width: 22px; height: 22px; border-radius: 50%;
      background: var(--danger); color: #fff; border: none;
      font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center;
      &:hover { filter: brightness(1.1); }
    }
    .preview-label { font-size: 12px; color: var(--text3); margin-top: 8px; }

    .logo-empty {
      width: 100%; padding: 24px; text-align: center;
      background: var(--surface2); border-radius: 12px; border: 1.5px dashed var(--border);
      color: var(--text3);
      .logo-empty-icon { font-size: 32px; margin-bottom: 6px; }
      p { font-size: 13px; }
    }

    /* Upload area */
    .upload-area {
      border: 2px dashed var(--accent-light);
      border-radius: 14px; padding: 28px 20px;
      text-align: center; cursor: pointer;
      background: var(--accent-soft);
      transition: all 0.2s;
      &:hover, &.drag-over {
        border-color: var(--accent);
        background: rgba(196,99,122,0.1);
        transform: scale(1.01);
      }
    }
    .upload-icon { font-size: 28px; margin-bottom: 8px; }
    .upload-text { font-size: 14px; font-weight: 600; color: var(--accent); margin-bottom: 4px; }
    .upload-hint { font-size: 12px; color: var(--text3); }

    .logo-tips {
      margin-top: 14px; padding: 12px 14px;
      background: rgba(90,158,124,0.08); border: 1px solid rgba(90,158,124,0.25);
      border-radius: 10px;
    }
    .tip { font-size: 13px; font-weight: 600; color: var(--success); margin-bottom: 4px; }
    .tip-text { font-size: 12px; color: var(--text2); }

    .field-hint { font-size: 12px; color: var(--text3); margin-top: -10px; margin-bottom: 20px; }

    /* Sidebar preview */
    .sidebar-preview { margin-top: 4px; }
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

  removeLogo() {
    this.logoPreview.set(null);
    this.toast.warning('Logo removido — clique em Salvar para confirmar');
  }

  save() {
    this.saving.set(true);
    this.http.put<any>('/api/settings', {
      store_name:  this.storeName || null,
      logo_base64: this.logoPreview() || null
    }).subscribe({
      next: (user) => {
        this.toast.success('Configurações salvas!');
        this.saving.set(false);
        // Update auth user signal with new store info
        const current = this.auth.currentUser();
        if (current) {
          localStorage.setItem('sf_user', JSON.stringify({ ...current, store_name: user.store_name }));
        }
        // Force layout to reload logo
        window.dispatchEvent(new CustomEvent('store-settings-updated', { detail: user }));
      },
      error: (e) => { this.toast.error(e.error?.error || 'Erro ao salvar'); this.saving.set(false); }
    });
  }
}

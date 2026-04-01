// components/users/users.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { HttpClient } from '@angular/common/http';
import { User } from '../../models';

interface SellerOverview {
  id: number; name: string; email: string; created_at: string;
  total_products: number; low_stock: number; month_revenue: number; month_sales: number;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page-wrap fade-in">
  <div class="page-header">
    <div>
      <div class="page-title">Usuários & Lojas</div>
      <div class="page-sub">{{ users().length }} usuário(s) — sistema multi-loja</div>
    </div>
    <button class="btn btn-primary" (click)="openModal()">+ Adicionar Usuário</button>
  </div>

  <!-- Overview cards das lojas dos vendedores -->
  @if (overview().length > 0) {
    <div class="section-title">📊 Resumo das Lojas (mês atual)</div>
    <div class="overview-grid">
      @for (s of overview(); track s.id) {
        <div class="store-card">
          <div class="store-header">
            <div class="store-av">{{ s.name[0].toUpperCase() }}</div>
            <div>
              <div class="store-name">{{ s.name }}</div>
              <div class="store-email">{{ s.email }}</div>
            </div>
          </div>
          <div class="store-stats">
            <div class="store-stat">
              <div class="store-stat-val">{{ formatCurrency(s.month_revenue) }}</div>
              <div class="store-stat-label">Faturamento</div>
            </div>
            <div class="store-stat">
              <div class="store-stat-val">{{ s.month_sales }}</div>
              <div class="store-stat-label">Vendas</div>
            </div>
            <div class="store-stat">
              <div class="store-stat-val">{{ s.total_products }}</div>
              <div class="store-stat-label">Produtos</div>
            </div>
            <div class="store-stat" [class.alert]="s.low_stock > 0">
              <div class="store-stat-val">{{ s.low_stock }}</div>
              <div class="store-stat-label">Estoque baixo</div>
            </div>
          </div>
        </div>
      }
    </div>
  }

  <!-- Tabela de usuários -->
  <div class="card" style="margin-top:24px;">
    @if (loading()) {
      <div style="padding:40px;text-align:center;"><div class="spinner"></div></div>
    } @else {
      <table class="sf-table">
        <thead><tr>
          <th>Usuário</th><th>Email</th><th>Papel</th><th>Cadastrado em</th><th>Ações</th>
        </tr></thead>
        <tbody>
          @for (u of users(); track u.id) {
            <tr>
              <td>
                <div style="display:flex;align-items:center;gap:12px;">
                  <div class="av" [class]="'av-' + u.role">{{ u.name[0].toUpperCase() }}</div>
                  <div>
                    <div style="font-weight:600;">{{ u.name }}</div>
                    @if (u.id === currentUser()?.id) {
                      <div style="font-size:11px;color:var(--accent);font-weight:600;">← Você</div>
                    }
                  </div>
                </div>
              </td>
              <td style="color:var(--text2);">{{ u.email }}</td>
              <td><span class="badge" [class]="roleBadge(u.role)">{{ roleLabel(u.role) }}</span></td>
              <td style="color:var(--text2);">{{ formatDate(u.created_at) }}</td>
              <td>
                @if (u.id !== currentUser()?.id) {
                  <div class="action-btns">
                    <button class="btn btn-ghost btn-sm" (click)="openEditModal(u)">✏️ Editar</button>
                    <button class="btn btn-sm btn-icon-danger" (click)="deleteUser(u.id, u.name)">🗑</button>
                  </div>
                } @else {
                  <span style="color:var(--text3);font-size:12px;">—</span>
                }
              </td>
            </tr>
          }
          @empty {
            <tr><td colspan="5">
              <div class="empty-state"><div class="empty-icon">👥</div><div class="empty-text">Nenhum usuário</div></div>
            </td></tr>
          }
        </tbody>
      </table>
    }
  </div>
</div>

@if (showModal()) {
  <div class="modal-overlay" (click)="closeModal()">
    <div class="modal" style="max-width:460px;" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <span class="modal-title">{{ editId() ? 'Editar Usuário' : 'Novo Usuário' }}</span>
        <button class="btn btn-ghost btn-sm" (click)="closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Nome Completo *</label>
          <input type="text" [(ngModel)]="form.name" placeholder="Nome do usuário">
        </div>
        <div class="form-group">
          <label>Email *</label>
          <input type="email" [(ngModel)]="form.email" placeholder="email@exemplo.com" [disabled]="!!editId()">
        </div>
        <div class="form-group">
          <label>{{ editId() ? 'Nova Senha (vazio = não alterar)' : 'Senha *' }}</label>
          <div class="pass-wrap">
            <input [type]="showFormPass() ? 'text' : 'password'" [(ngModel)]="form.password"
                   [placeholder]="editId() ? 'Nova senha (opcional)' : 'Mínimo 6 caracteres'">
            <button class="pass-eye" type="button" (click)="toggleFormPass()">
              {{ showFormPass() ? '🙈' : '👁' }}
            </button>
          </div>
        </div>
        <div class="form-group">
          <label>Papel</label>
          <select [(ngModel)]="form.role">
            <option value="vendedor">🛒 Vendedor — loja própria</option>
            <option value="admin">🔑 Administrador — acesso total</option>
          </select>
        </div>
        <div class="role-info">
          @if (form.role === 'admin') {
            <div class="role-card admin">🔑 <strong>Administrador:</strong> vê todas as lojas, gerencia usuários e categorias. Não tem loja própria.</div>
          }
          @if (form.role === 'vendedor') {
            <div class="role-card vendedor">🛒 <strong>Vendedor:</strong> tem sua própria loja com estoque e vendas independentes.</div>
          }
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" (click)="closeModal()">Cancelar</button>
        <button class="btn btn-primary" [disabled]="saving()" (click)="save()">
          @if (saving()) {
            <span class="btn-spinner-sm"></span> Salvando...
          } @else {
            💾 {{ editId() ? 'Salvar' : 'Criar Usuário' }}
          }
        </button>
      </div>
    </div>
  </div>
}
  `,
  styles: [`
    .section-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 18px; font-weight: 600; color: var(--text);
      margin-bottom: 14px;
    }
    .overview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px; margin-bottom: 8px;
    }
    .store-card {
      background: var(--surface); border: 1.5px solid var(--border);
      border-radius: 16px; padding: 18px;
      box-shadow: var(--shadow-sm);
      transition: transform 0.2s, box-shadow 0.2s;
      &:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
    }
    .store-header {
      display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
      padding-bottom: 14px; border-bottom: 1px solid var(--border);
    }
    .store-av {
      width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, var(--accent), var(--accent-light));
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 18px; color: #fff;
    }
    .store-name { font-weight: 600; font-size: 15px; }
    .store-email { font-size: 12px; color: var(--text2); margin-top: 2px; }
    .store-stats {
      display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
    }
    .store-stat {
      background: var(--surface2); border-radius: 10px; padding: 10px 12px;
      &.alert { background: rgba(212,82,110,0.08); }
      &.alert .store-stat-val { color: var(--danger); }
    }
    .store-stat-val {
      font-family: 'Cormorant Garamond', serif;
      font-size: 20px; font-weight: 700; color: var(--text);
    }
    .store-stat-label { font-size: 11px; color: var(--text2); margin-top: 2px; }

    .av {
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 14px; color: #fff; flex-shrink: 0;
    }
    .av-admin   { background: linear-gradient(135deg, var(--accent), var(--accent3)); }
    .av-vendedor { background: linear-gradient(135deg, #5a9e7c, #3d7a5e); }

    .pass-wrap { position: relative; }
    .pass-eye {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; font-size: 15px;
      color: var(--text3); padding: 4px;
      &:hover { color: var(--accent); }
    }
    .pass-wrap input { padding-right: 42px; }

    .role-card {
      padding: 10px 14px; border-radius: 10px; font-size: 13px; line-height: 1.5; margin-top: 4px;
      &.admin   { background: rgba(196,99,122,0.08); color: var(--accent); border: 1px solid rgba(196,99,122,0.2); }
      &.vendedor { background: rgba(90,158,124,0.08); color: var(--success); border: 1px solid rgba(90,158,124,0.2); }
    }

    .btn-spinner-sm {
      width: 12px; height: 12px; border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #fff; border-radius: 50%;
      animation: spin 0.6s linear infinite; display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class UsersComponent implements OnInit {
  private api   = inject(ApiService);
  private auth  = inject(AuthService);
  private toast = inject(ToastService);
  private http  = inject(HttpClient);

  users        = signal<User[]>([]);
  overview     = signal<SellerOverview[]>([]);
  loading      = signal(true);
  showModal    = signal(false);
  saving       = signal(false);
  editId       = signal<number | null>(null);
  showFormPass = signal(false);
  currentUser  = this.auth.currentUser;

  form: { name: string; email: string; password: string; role: string } = this.emptyForm();

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getUsers().subscribe({
      next: u => { this.users.set(u); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
    this.http.get<SellerOverview[]>('/api/admin/overview').subscribe({
      next: o => this.overview.set(o),
      error: () => {}
    });
  }

  toggleFormPass() { this.showFormPass.set(!this.showFormPass()); }

  openModal() {
    this.editId.set(null);
    this.form = this.emptyForm();
    this.showFormPass.set(false);
    this.showModal.set(true);
  }

  openEditModal(u: User) {
    this.editId.set(u.id);
    this.form = { name: u.name, email: u.email, password: '', role: u.role };
    this.showFormPass.set(false);
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  save() {
    if (!this.form.name.trim()) { this.toast.error('Nome é obrigatório'); return; }
    if (!this.form.email.trim()) { this.toast.error('Email é obrigatório'); return; }
    if (!this.editId() && this.form.password.length < 6) { this.toast.error('Senha mínima: 6 caracteres'); return; }
    this.saving.set(true);

    if (this.editId()) {
      const body: any = { name: this.form.name, role: this.form.role };
      if (this.form.password.length >= 6) body.password = this.form.password;
      this.http.put(`/api/users/${this.editId()}`, body).subscribe({
        next: () => { this.toast.success('Usuário atualizado!'); this.closeModal(); this.load(); this.saving.set(false); },
        error: (e: any) => { this.toast.error(e.error?.error || 'Erro ao atualizar'); this.saving.set(false); }
      });
    } else {
      this.auth.register(this.form.name, this.form.email, this.form.password, this.form.role).subscribe({
        next: () => { this.toast.success('Usuário criado! Cada vendedor tem sua loja separada.'); this.closeModal(); this.load(); this.saving.set(false); },
        error: (e: any) => { this.toast.error(e.error?.error || 'Erro ao criar'); this.saving.set(false); }
      });
    }
  }

  deleteUser(id: number, name: string) {
    if (!confirm(`Deletar "${name}"? Todos os produtos e vendas desta loja serão apagados!`)) return;
    this.api.deleteUser(id).subscribe({
      next: () => { this.toast.warning(`Usuário e loja de "${name}" removidos`); this.load(); },
      error: (e: any) => this.toast.error(e.error?.error || 'Erro ao deletar')
    });
  }

  roleLabel(role: string) {
    return role === 'admin' ? 'Admin' : 'Vendedor';
  }
  roleBadge(role: string) {
    return role === 'admin' ? 'badge badge-danger' : 'badge badge-success';
  }
  formatDate(iso: string) { return new Date(iso).toLocaleDateString('pt-BR'); }
  formatCurrency(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  private emptyForm() { return { name: '', email: '', password: '', role: 'vendedor' }; }
}

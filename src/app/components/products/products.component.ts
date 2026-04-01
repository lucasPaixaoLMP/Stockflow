// components/products/products.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { Product, Category } from '../../models';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page-wrap fade-in">
  <div class="page-header">
    <div>
      <div class="page-title">Produtos</div>
      <div class="page-sub">{{ products().length }} produto(s) cadastrado(s)</div>
    </div>
    <button class="btn btn-primary" (click)="openModal()">+ Novo Produto</button>
  </div>

  <div class="card">
    <div class="card-header">
      <span class="card-title">📦 Catálogo</span>
      <div class="table-actions">
        <input class="search-input" type="text" [(ngModel)]="search" (ngModelChange)="loadProducts()" placeholder="🔍 Buscar produto...">
        <select [(ngModel)]="filterCat" (ngModelChange)="loadProducts()" style="width:170px;padding:8px 12px;border-radius:8px;background:var(--surface2);border:1px solid var(--border);color:var(--text);outline:none;">
          <option value="">Todas categorias</option>
          @for (c of categories(); track c.id) {
            <option [value]="c.id">{{ c.name }}</option>
          }
        </select>
      </div>
    </div>

    @if (loading()) {
      <div style="padding:40px;text-align:center;"><div class="spinner"></div></div>
    } @else {
      <table class="sf-table">
        <thead><tr>
          <th>Produto</th><th>Categoria</th><th>Custo</th><th>Venda</th>
          <th>Estoque</th><th>Margem</th><th>Ações</th>
        </tr></thead>
        <tbody>
          @for (p of products(); track p.id) {
            <tr>
              <td>
                <div style="font-weight:600;">{{ p.name }}</div>
                <div style="font-size:12px;color:var(--text3);">{{ p.description }}</div>
              </td>
              <td>
                @if (p.category_name) {
                  <span class="category-pill" [style.background]="p.category_color + '22'" [style.color]="p.category_color">
                    {{ p.category_name }}
                  </span>
                } @else { <span style="color:var(--text3)">—</span> }
              </td>
              <td class="mono">{{ formatCurrency(p.cost_price) }}</td>
              <td class="mono"><strong>{{ formatCurrency(p.sale_price) }}</strong></td>
              <td>
                <span class="badge" [class]="stockBadge(p)">{{ p.stock }} {{ p.unit }}</span>
              </td>
              <td class="mono">{{ margin(p) }}</td>
              <td class="action-btns">
                <button class="btn btn-ghost btn-sm" (click)="openModal(p)">✏️</button>
                @if (isAdmin()) {
                  <button class="btn btn-sm btn-icon-danger" (click)="deleteProduct(p.id)">🗑</button>
                }
              </td>
            </tr>
          }
          @empty {
            <tr><td colspan="7">
              <div class="empty-state"><div class="empty-icon">📦</div><div class="empty-text">Nenhum produto encontrado</div></div>
            </td></tr>
          }
        </tbody>
      </table>
    }
  </div>
</div>

<!-- Modal -->
@if (showModal()) {
  <div class="modal-overlay" (click)="closeModal()">
    <div class="modal" style="max-width:560px;" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <span class="modal-title">{{ editId() ? 'Editar Produto' : 'Novo Produto' }}</span>
        <button class="btn btn-ghost btn-sm" (click)="closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Nome *</label>
          <input type="text" [(ngModel)]="form.name" placeholder="Ex: Notebook Dell i7">
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label>Categoria</label>
            <select [(ngModel)]="form.category_id">
              <option [value]="null">Sem categoria</option>
              @for (c of categories(); track c.id) {
                <option [value]="c.id">{{ c.name }}</option>
              }
            </select>
          </div>
          <div class="form-group">
            <label>Unidade</label>
            <select [(ngModel)]="form.unit">
              <option value="un">Unidade (un)</option>
              <option value="kg">Quilo (kg)</option>
              <option value="g">Grama (g)</option>
              <option value="l">Litro (l)</option>
              <option value="m">Metro (m)</option>
              <option value="cx">Caixa (cx)</option>
            </select>
          </div>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label>Preço de Custo (R$)</label>
            <div class="currency-wrap">
              <span class="currency-prefix">R$</span>
              <input type="number" [(ngModel)]="form.cost_price" step="0.01" min="0" class="currency-input" placeholder="0,00">
            </div>
          </div>
          <div class="form-group">
            <label>Preço de Venda (R$)</label>
            <div class="currency-wrap">
              <span class="currency-prefix">R$</span>
              <input type="number" [(ngModel)]="form.sale_price" step="0.01" min="0" class="currency-input" placeholder="0,00">
            </div>
          </div>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label>Estoque Atual</label>
            <input type="number" [(ngModel)]="form.stock" min="0" placeholder="0">
          </div>
          <div class="form-group">
            <label>Estoque Mínimo (Alerta)</label>
            <input type="number" [(ngModel)]="form.min_stock" min="0" placeholder="5">
          </div>
        </div>
        <div class="form-group">
          <label>Descrição</label>
          <textarea [(ngModel)]="form.description" rows="2" placeholder="Descrição opcional..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" (click)="closeModal()">Cancelar</button>
        <button class="btn btn-primary" [disabled]="saving()" (click)="save()">
          {{ saving() ? '⏳ Salvando...' : '💾 Salvar' }}
        </button>
      </div>
    </div>
  </div>
}
  `,
  styles: [`.table-actions { display: flex; gap: 10px; flex-wrap: wrap; }`]
})
export class ProductsComponent implements OnInit {
  private api   = inject(ApiService);
  private toast = inject(ToastService);
  private auth  = inject(AuthService);

  products   = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading    = signal(true);
  showModal  = signal(false);
  saving     = signal(false);
  editId     = signal<number | null>(null);

  search    = '';
  filterCat = '';

  form: Partial<Product> = this.emptyForm();

  isAdmin() { return this.auth.isAdmin(); }

  ngOnInit() {
    this.loadProducts();
    this.api.getCategories().subscribe(c => this.categories.set(c));
  }

  loadProducts() {
    this.loading.set(true);
    this.api.getProducts(this.search || undefined, this.filterCat ? +this.filterCat : undefined).subscribe(p => {
      this.products.set(p); this.loading.set(false);
    });
  }

  openModal(p?: Product) {
    if (p) {
      this.editId.set(p.id);
      this.form = { ...p };
    } else {
      this.editId.set(null);
      this.form = this.emptyForm();
    }
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  save() {
    if (!this.form.name?.trim()) { this.toast.error('Nome é obrigatório'); return; }
    this.saving.set(true);
    const obs = this.editId()
      ? this.api.updateProduct(this.editId()!, this.form)
      : this.api.createProduct(this.form);
    obs.subscribe({
      next: () => {
        this.toast.success(this.editId() ? 'Produto atualizado!' : 'Produto criado!');
        this.closeModal(); this.loadProducts(); this.saving.set(false);
      },
      error: (e) => { this.toast.error(e.error?.error || 'Erro ao salvar'); this.saving.set(false); }
    });
  }

  deleteProduct(id: number) {
    if (!confirm('Deletar este produto?')) return;
    this.api.deleteProduct(id).subscribe({
      next: () => { this.toast.warning('Produto deletado'); this.loadProducts(); },
      error: (e) => this.toast.error(e.error?.error || 'Erro ao deletar')
    });
  }

  stockBadge(p: Product) {
    if (p.stock === 0) return 'badge badge-danger';
    if (p.stock <= p.min_stock) return 'badge badge-warning';
    return 'badge badge-success';
  }

  margin(p: Product) {
    if (!p.cost_price) return '—';
    return ((p.sale_price - p.cost_price) / p.cost_price * 100).toFixed(1) + '%';
  }

  formatCurrency(v: number) { return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }); }

  private emptyForm(): Partial<Product> {
    return { name: '', description: '', category_id: undefined, unit: 'un', cost_price: 0, sale_price: 0, stock: 0, min_stock: 5 };
  }
}

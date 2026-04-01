// components/categories/categories.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { Category } from '../../models';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page-wrap fade-in">
  <div class="page-header">
    <div>
      <div class="page-title">Categorias</div>
      <div class="page-sub">Organize seus produtos por categoria</div>
    </div>
    <button class="btn btn-primary" (click)="openModal()">+ Nova Categoria</button>
  </div>

  <div class="card">
    <table class="sf-table">
      <thead><tr><th>Categoria</th><th>Cor</th><th>Produtos</th><th>Ações</th></tr></thead>
      <tbody>
        @for (c of categories(); track c.id) {
          <tr>
            <td>
              <span class="category-pill" [style.background]="c.color + '22'" [style.color]="c.color">
                {{ c.name }}
              </span>
            </td>
            <td><div style="width:26px;height:26px;border-radius:6px;" [style.background]="c.color"></div></td>
            <td>{{ c.product_count ?? 0 }} produto(s)</td>
            <td class="action-btns">
              <button class="btn btn-ghost btn-sm" (click)="openModal(c)">✏️</button>
              <button class="btn btn-sm btn-icon-danger" (click)="deleteCategory(c.id)">🗑</button>
            </td>
          </tr>
        }
        @empty {
          <tr><td colspan="4">
            <div class="empty-state"><div class="empty-icon">🏷️</div><div class="empty-text">Nenhuma categoria cadastrada</div></div>
          </td></tr>
        }
      </tbody>
    </table>
  </div>
</div>

@if (showModal()) {
  <div class="modal-overlay" (click)="closeModal()">
    <div class="modal" style="max-width:380px;" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <span class="modal-title">{{ editId() ? 'Editar' : 'Nova' }} Categoria</span>
        <button class="btn btn-ghost btn-sm" (click)="closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Nome *</label>
          <input type="text" [(ngModel)]="formName" placeholder="Ex: Eletrônicos">
        </div>
        <div class="form-group">
          <label>Cor</label>
          <input type="color" [(ngModel)]="formColor">
        </div>
        <div style="margin-top:12px;">
          <span class="category-pill" [style.background]="formColor + '22'" [style.color]="formColor">
            {{ formName || 'Prévia' }}
          </span>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" (click)="closeModal()">Cancelar</button>
        <button class="btn btn-primary" [disabled]="saving()" (click)="save()">
          {{ saving() ? '⏳...' : '💾 Salvar' }}
        </button>
      </div>
    </div>
  </div>
}
  `
})
export class CategoriesComponent implements OnInit {
  private api   = inject(ApiService);
  private toast = inject(ToastService);

  categories = signal<Category[]>([]);
  showModal  = signal(false);
  saving     = signal(false);
  editId     = signal<number | null>(null);
  formName   = '';
  formColor  = '#6c63ff';

  ngOnInit() { this.load(); }

  load() { this.api.getCategories().subscribe(c => this.categories.set(c)); }

  openModal(c?: Category) {
    this.editId.set(c?.id ?? null);
    this.formName  = c?.name  ?? '';
    this.formColor = c?.color ?? '#6c63ff';
    this.showModal.set(true);
  }
  closeModal() { this.showModal.set(false); }

  save() {
    if (!this.formName.trim()) { this.toast.error('Nome é obrigatório'); return; }
    this.saving.set(true);
    const obs = this.editId()
      ? this.api.updateCategory(this.editId()!, { name: this.formName, color: this.formColor })
      : this.api.createCategory({ name: this.formName, color: this.formColor });
    obs.subscribe({
      next: () => { this.toast.success('Categoria salva!'); this.closeModal(); this.load(); this.saving.set(false); },
      error: (e) => { this.toast.error(e.error?.error || 'Erro'); this.saving.set(false); }
    });
  }

  deleteCategory(id: number) {
    if (!confirm('Deletar esta categoria?')) return;
    this.api.deleteCategory(id).subscribe({
      next: () => { this.toast.warning('Categoria deletada'); this.load(); },
      error: (e) => this.toast.error(e.error?.error || 'Não é possível deletar')
    });
  }
}

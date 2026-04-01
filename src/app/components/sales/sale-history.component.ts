// components/sales/sale-history.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { Sale } from '../../models';

@Component({
  selector: 'app-sale-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page-wrap fade-in">
  <div class="page-header">
    <div>
      <div class="page-title">Histórico de Vendas</div>
      <div class="page-sub">{{ summary() }}</div>
    </div>
    <button class="btn btn-ghost btn-sm" (click)="exportCSV()">⬇️ Exportar CSV</button>
  </div>

  <!-- Filters -->
  <div class="filter-bar">
    <div class="form-group" style="margin:0">
      <label>Data Início</label>
      <input type="date" [(ngModel)]="filterStart" style="width:150px;">
    </div>
    <div class="form-group" style="margin:0">
      <label>Data Fim</label>
      <input type="date" [(ngModel)]="filterEnd" style="width:150px;">
    </div>
    <div class="form-group" style="margin:0">
      <label>Pagamento</label>
      <select [(ngModel)]="filterPayment" style="width:170px;">
        <option value="">Todos</option>
        <option>Dinheiro</option>
        <option>PIX</option>
        <option>Cartão de Crédito</option>
        <option>Cartão de Débito</option>
        <option>Boleto</option>
      </select>
    </div>
    <button class="btn btn-primary btn-sm" style="margin-top:22px;" (click)="loadSales()">🔍 Filtrar</button>
    <button class="btn btn-ghost btn-sm" style="margin-top:22px;" (click)="clearFilters()">✕ Limpar</button>
  </div>

  <div class="card">
    @if (loading()) {
      <div style="padding:40px;text-align:center;"><div class="spinner"></div></div>
    } @else {
      <table class="sf-table">
        <thead><tr>
          <th>ID</th><th>Data & Hora</th><th>Cliente</th><th>Itens</th>
          <th>Pagamento</th><th>Vendedor</th><th>Total</th><th>Ações</th>
        </tr></thead>
        <tbody>
          @for (s of sales(); track s.id) {
            <tr>
              <td class="mono">#{{ s.id }}</td>
              <td>{{ formatDateFull(s.created_at) }}</td>
              <td>{{ s.client_name }}</td>
              <td><span class="badge badge-info">{{ s.items.length }} item(s)</span></td>
              <td>{{ s.payment_method }}</td>
              <td>{{ s.seller_name || '—' }}</td>
              <td><strong class="mono">{{ formatCurrency(s.total) }}</strong></td>
              <td class="action-btns">
                <button class="btn btn-ghost btn-sm" (click)="viewDetail(s)">👁</button>
                @if (isAdmin()) {
                  <button class="btn btn-sm btn-icon-danger" (click)="deleteSale(s.id)">🗑</button>
                }
              </td>
            </tr>
          }
          @empty {
            <tr><td colspan="8">
              <div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">Nenhuma venda encontrada</div></div>
            </td></tr>
          }
        </tbody>
      </table>
    }
  </div>
</div>

<!-- Detail Modal -->
@if (detailSale()) {
  <div class="modal-overlay" (click)="detailSale.set(null)">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <span class="modal-title">Venda #{{ detailSale()!.id }}</span>
        <button class="btn btn-ghost btn-sm" (click)="detailSale.set(null)">✕</button>
      </div>
      <div class="modal-body">
        <div class="grid-2" style="margin-bottom:20px;">
          <div><div class="detail-label">Data</div><div>{{ formatDateFull(detailSale()!.created_at) }}</div></div>
          <div><div class="detail-label">Cliente</div><div>{{ detailSale()!.client_name }}</div></div>
          <div><div class="detail-label">Pagamento</div><div>{{ detailSale()!.payment_method }}</div></div>
          <div>
            <div class="detail-label">Total</div>
            <div style="font-size:22px;font-weight:700;color:var(--accent2);">{{ formatCurrency(detailSale()!.total) }}</div>
          </div>
        </div>
        <div class="detail-label" style="margin-bottom:10px;">Itens da Venda</div>
        <table class="sf-table">
          <thead><tr><th>Produto</th><th>Qtd</th><th>Unit.</th><th>Subtotal</th></tr></thead>
          <tbody>
            @for (item of detailSale()!.items; track item.id) {
              <tr>
                <td>{{ item.product_name }}</td>
                <td>{{ item.quantity }}</td>
                <td class="mono">{{ formatCurrency(item.unit_price) }}</td>
                <td class="mono"><strong>{{ formatCurrency(item.unit_price * item.quantity) }}</strong></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" (click)="detailSale.set(null)">Fechar</button>
      </div>
    </div>
  </div>
}
  `,
  styles: [`.detail-label { font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }`]
})
export class SaleHistoryComponent implements OnInit {
  private api   = inject(ApiService);
  private toast = inject(ToastService);
  private auth  = inject(AuthService);

  sales      = signal<Sale[]>([]);
  loading    = signal(true);
  detailSale = signal<Sale | null>(null);
  summary    = signal('');

  filterStart = '';
  filterEnd   = '';
  filterPayment = '';

  isAdmin() { return this.auth.isAdmin(); }

  ngOnInit() { this.loadSales(); }

  loadSales() {
    this.loading.set(true);
    const filters: any = {};
    if (this.filterStart)   filters.start = this.filterStart;
    if (this.filterEnd)     filters.end   = this.filterEnd;
    if (this.filterPayment) filters.payment_method = this.filterPayment;
    this.api.getSales(filters).subscribe(s => {
      this.sales.set(s);
      const total = s.reduce((a, x) => a + x.total, 0);
      this.summary.set(`Total: ${this.formatCurrency(total)} | ${s.length} venda(s)`);
      this.loading.set(false);
    });
  }

  clearFilters() {
    this.filterStart = ''; this.filterEnd = ''; this.filterPayment = '';
    this.loadSales();
  }

  viewDetail(s: Sale) { this.detailSale.set(s); }

  deleteSale(id: number) {
    if (!confirm('Deletar esta venda?')) return;
    this.api.deleteSale(id).subscribe({
      next: () => { this.toast.warning('Venda deletada'); this.loadSales(); },
      error: () => this.toast.error('Erro ao deletar')
    });
  }

  exportCSV() {
    const s = this.sales();
    let csv = 'ID,Data,Cliente,Pagamento,Itens,Total\n';
    csv += s.map(x => `${x.id},"${this.formatDateFull(x.created_at)}","${x.client_name}","${x.payment_method}","${x.items.map(i => i.product_name + ' x' + i.quantity).join('|')}","${x.total.toFixed(2)}"`).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'vendas.csv'; a.click();
  }

  formatCurrency(v: number) { return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }); }
  formatDateFull(iso: string) { return new Date(iso).toLocaleString('pt-BR'); }
}

// components/sales/new-sale.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { Product, SaleItem } from '../../models';

@Component({
  selector: 'app-new-sale',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page-wrap fade-in">
  <div class="page-header">
    <div>
      <div class="page-title">Nova Venda</div>
      <div class="page-sub">Registre uma venda adicionando produtos ao carrinho</div>
    </div>
  </div>

  <div class="card sale-card">
    <!-- Cliente + Pgto -->
    <div class="grid-2" style="margin-bottom:20px;">
      <div class="form-group" style="margin:0">
        <label>Cliente (Opcional)</label>
        <input type="text" [(ngModel)]="clientName" placeholder="Nome do cliente">
      </div>
      <div class="form-group" style="margin:0">
        <label>Forma de Pagamento</label>
        <select [(ngModel)]="paymentMethod">
          <option value="Dinheiro">💵 Dinheiro</option>
          <option value="PIX">📱 PIX</option>
          <option value="Cartão de Crédito">💳 Cartão de Crédito</option>
          <option value="Cartão de Débito">💳 Cartão de Débito</option>
          <option value="Boleto">📄 Boleto</option>
        </select>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Add item -->
    <div class="add-item-row">
      <div class="form-group" style="flex:1;margin:0">
        <label>Produto</label>
        <select [(ngModel)]="selectedProductId" (ngModelChange)="onProductChange($event)">
          <option value="">— Selecione —</option>
          @for (p of products(); track p.id) {
            <option [value]="p.id">{{ p.name }} — {{ formatCurrency(p.sale_price) }} (Estoque: {{ p.stock }} {{ p.unit }})</option>
          }
        </select>
      </div>
      <div class="form-group" style="width:100px;margin:0">
        <label>Qtd</label>
        <input type="number" [(ngModel)]="addQty" min="1" [max]="selectedStock()">
      </div>
      <button class="btn btn-secondary" style="margin-top:22px;" (click)="addItem()">+ Adicionar</button>
    </div>

    <!-- Items table -->
    @if (saleItems().length > 0) {
      <table class="sf-table" style="margin-top:16px;margin-bottom:8px;">
        <thead><tr><th>Produto</th><th>Qtd</th><th>Unit.</th><th>Subtotal</th><th></th></tr></thead>
        <tbody>
          @for (item of saleItems(); track item.product_id; let i = $index) {
            <tr>
              <td>{{ item.product_name }}</td>
              <td>
                <input type="number" [value]="item.quantity" (change)="updateQty(i, $event)"
                  min="1" style="width:65px;padding:5px 8px;font-size:13px;">
              </td>
              <td class="mono">{{ formatCurrency(item.unit_price) }}</td>
              <td class="mono"><strong>{{ formatCurrency(item.unit_price * item.quantity) }}</strong></td>
              <td>
                <button class="btn btn-sm btn-icon-danger" (click)="removeItem(i)">✕</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    }

    <!-- Total -->
    <div class="sale-total">
      <div>
        <div style="color:var(--text2);font-weight:600;">Total da Venda</div>
        <div style="font-size:12px;color:var(--text3);">{{ saleItems().length }} item(s)</div>
      </div>
      <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:26px;color:var(--accent2);">
        {{ formatCurrency(saleTotal()) }}
      </div>
    </div>

    <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:16px;">
      <button class="btn btn-ghost" (click)="clearSale()">🗑️ Limpar</button>
      <button class="btn btn-success" [disabled]="saleItems().length === 0 || saving()" (click)="finalize()">
        {{ saving() ? '⏳ Salvando...' : '✅ Finalizar Venda' }}
      </button>
    </div>
  </div>
</div>
  `,
  styles: [`
    .sale-card { padding: 26px; }
    .add-item-row { display: flex; gap: 14px; align-items: flex-end; flex-wrap: wrap; }
    .sale-total {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 0; margin-top: 12px;
      border-top: 2px solid var(--border);
    }
  `]
})
export class NewSaleComponent implements OnInit {
  private api   = inject(ApiService);
  private toast = inject(ToastService);

  products       = signal<Product[]>([]);
  saleItems      = signal<SaleItem[]>([]);
  saving         = signal(false);
  selectedStock  = signal(0);

  clientName = '';
  paymentMethod = 'Dinheiro';
  selectedProductId: number | '' = '';
  addQty = 1;

  saleTotal() {
    return this.saleItems().reduce((a, i) => a + i.unit_price * i.quantity, 0);
  }

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.api.getProducts().subscribe(p => this.products.set(p.filter(x => x.stock > 0)));
  }

  onProductChange(id: any) {
    const p = this.products().find(x => x.id === +id);
    this.selectedStock.set(p?.stock ?? 0);
    this.addQty = 1;
  }

  addItem() {
    if (!this.selectedProductId) { this.toast.warning('Selecione um produto'); return; }
    const prod = this.products().find(p => p.id === +this.selectedProductId);
    if (!prod) return;

    const qty = Math.max(1, this.addQty);
    const existing = this.saleItems().find(i => i.product_id === prod.id);
    const totalQty = (existing?.quantity ?? 0) + qty;

    if (totalQty > prod.stock) {
      this.toast.error(`Estoque insuficiente! Disponível: ${prod.stock} ${prod.unit}`); return;
    }

    if (existing) {
      this.saleItems.update(items => items.map(i =>
        i.product_id === prod.id ? { ...i, quantity: i.quantity + qty } : i
      ));
    } else {
      this.saleItems.update(items => [...items, {
        product_id: prod.id, product_name: prod.name, quantity: qty, unit_price: prod.sale_price
      }]);
    }

    this.selectedProductId = '';
    this.addQty = 1;
  }

  updateQty(idx: number, event: Event) {
    const val = +(event.target as HTMLInputElement).value || 1;
    this.saleItems.update(items => items.map((item, i) => i === idx ? { ...item, quantity: Math.max(1, val) } : item));
  }

  removeItem(idx: number) {
    this.saleItems.update(items => items.filter((_, i) => i !== idx));
  }

  clearSale() {
    this.saleItems.set([]);
    this.clientName = '';
    this.selectedProductId = '';
  }

  finalize() {
    if (this.saleItems().length === 0) { this.toast.warning('Adicione ao menos um produto'); return; }
    this.saving.set(true);
    this.api.createSale({
      client_name: this.clientName || 'Cliente Anônimo',
      payment_method: this.paymentMethod,
      items: this.saleItems(),
      total: this.saleTotal()
    }).subscribe({
      next: (sale) => {
        this.toast.success(`Venda #${sale.id} de ${this.formatCurrency(sale.total)} registrada! ✅`);
        this.clearSale();
        this.loadProducts();
        this.saving.set(false);
      },
      error: (e) => {
        this.toast.error(e.error?.error || 'Erro ao registrar venda');
        this.saving.set(false);
      }
    });
  }

  formatCurrency(v: number) {
    return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  }
}

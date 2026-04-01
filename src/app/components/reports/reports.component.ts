// components/reports/reports.component.ts
import { Component, inject, signal, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { TopProduct, SalesByPayment, SalesByCategory } from '../../models';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page-wrap fade-in">
  <div class="page-header">
    <div>
      <div class="page-title">Relatórios</div>
      <div class="page-sub">Análise detalhada de vendas e estoque</div>
    </div>
    <select [(ngModel)]="period" (ngModelChange)="load()" style="padding:9px 14px;border-radius:8px;background:var(--surface2);border:1px solid var(--border);color:var(--text);outline:none;">
      <option value="7">Últimos 7 dias</option>
      <option value="14">Últimos 14 dias</option>
      <option value="30">Últimos 30 dias</option>
      <option value="90">Últimos 90 dias</option>
    </select>
  </div>

  <!-- Stats -->
  <div class="stats-grid" style="margin-bottom:22px;">
    <div class="stat-card purple">
      <div class="stat-icon">💰</div>
      <div class="stat-value">{{ formatCurrency(totals().revenue) }}</div>
      <div class="stat-label">Receita Total</div>
    </div>
    <div class="stat-card green">
      <div class="stat-icon">🧾</div>
      <div class="stat-value">{{ totals().count }}</div>
      <div class="stat-label">Nº de Vendas</div>
    </div>
    <div class="stat-card yellow">
      <div class="stat-icon">🎯</div>
      <div class="stat-value">{{ formatCurrency(totals().avgTicket) }}</div>
      <div class="stat-label">Ticket Médio</div>
    </div>
    <div class="stat-card red">
      <div class="stat-icon">📦</div>
      <div class="stat-value">{{ totals().items }}</div>
      <div class="stat-label">Itens Vendidos</div>
    </div>
  </div>

  <!-- Charts -->
  <div class="chart-row">
    <div class="card">
      <div class="card-header"><span class="card-title">📅 Vendas por Dia</span></div>
      <div class="chart-wrap"><canvas #barChart></canvas></div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">💳 Por Forma de Pagamento</span></div>
      <div class="chart-wrap"><canvas #pieChart></canvas></div>
    </div>
  </div>

  <!-- Tables -->
  <div class="chart-row" style="margin-top:20px;">
    <div class="card">
      <div class="card-header"><span class="card-title">🏆 Produtos Mais Vendidos</span></div>
      <table class="sf-table">
        <thead><tr><th>#</th><th>Produto</th><th>Qtd</th><th>Receita</th></tr></thead>
        <tbody>
          @for (p of topProducts(); track p.product_name; let i = $index) {
            <tr>
              <td style="color:{{ i < 3 ? 'var(--warning)' : 'var(--text3)' }};font-weight:700;">{{ i + 1 }}</td>
              <td>{{ p.product_name }}</td>
              <td class="mono">{{ p.total_qty }}</td>
              <td class="mono"><strong>{{ formatCurrency(p.total_revenue) }}</strong></td>
            </tr>
          }
          @empty { <tr><td colspan="4"><div class="empty-state">Sem dados</div></td></tr> }
        </tbody>
      </table>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">📊 Resumo por Categoria</span></div>
      <table class="sf-table">
        <thead><tr><th>Categoria</th><th>Qtd</th><th>Receita</th><th>%</th></tr></thead>
        <tbody>
          @for (c of catSummary(); track c.name) {
            <tr>
              <td><span class="category-pill" [style.background]="c.color + '22'" [style.color]="c.color">{{ c.name }}</span></td>
              <td class="mono">{{ c.qty }}</td>
              <td class="mono"><strong>{{ formatCurrency(c.total) }}</strong></td>
              <td>
                <div style="display:flex;align-items:center;gap:8px;">
                  <div style="flex:1;height:5px;background:var(--surface3);border-radius:3px;overflow:hidden;">
                    <div [style.width.%]="catPct(c)" [style.background]="c.color" style="height:100%;"></div>
                  </div>
                  <span class="mono" style="font-size:12px;">{{ catPct(c).toFixed(1) }}%</span>
                </div>
              </td>
            </tr>
          }
          @empty { <tr><td colspan="4"><div class="empty-state">Sem dados</div></td></tr> }
        </tbody>
      </table>
    </div>
  </div>
</div>
  `,
  styles: [`
    .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 18px; }
    .chart-row  { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    @media (max-width: 900px) { .stats-grid { grid-template-columns: 1fr 1fr; } .chart-row { grid-template-columns: 1fr; } }
  `]
})
export class ReportsComponent implements OnInit, AfterViewInit, OnDestroy {
  private api = inject(ApiService);

  @ViewChild('barChart') barEl!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieChart') pieEl!: ElementRef<HTMLCanvasElement>;

  period      = '30';
  topProducts = signal<TopProduct[]>([]);
  catSummary  = signal<SalesByCategory[]>([]);
  totals      = signal({ revenue: 0, count: 0, avgTicket: 0, items: 0 });

  private barChart?: Chart;
  private pieChart?: Chart;

  ngOnInit() { this.load(); }
  ngAfterViewInit() { this.drawCharts(); }

  load() {
    const d = +this.period;
    this.api.getTopProducts(d).subscribe(p => this.topProducts.set(p));
    this.api.getReportSalesByCategory(d).subscribe(c => {
      this.catSummary.set(c.filter(x => x.total > 0));
    });
    this.api.getSales().subscribe(sales => {
      const cut = new Date(); cut.setDate(cut.getDate() - d);
      const filtered = sales.filter(s => new Date(s.created_at) >= cut);
      const revenue = filtered.reduce((a, s) => a + s.total, 0);
      const count   = filtered.length;
      const items   = filtered.reduce((a, s) => a + s.items.reduce((b, i) => b + i.quantity, 0), 0);
      this.totals.set({ revenue, count, avgTicket: count ? revenue / count : 0, items });
    });
    this.drawCharts();
  }

  drawCharts() {
    const d = +this.period;
    this.api.getReportSalesByDay(d).subscribe(data => {
      if (this.barChart) this.barChart.destroy();
      if (!this.barEl) return;
      this.barChart = new Chart(this.barEl.nativeElement, {
        type: 'bar',
        data: {
          labels: data.map(x => x.day.slice(5).replace('-', '/')),
          datasets: [{ label: 'Receita (R$)', data: data.map(x => x.total), backgroundColor: 'rgba(196,99,122,0.6)', borderColor: '#c4637a', borderRadius: 5 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: 'rgba(196,99,122,0.08)' }, ticks: { color: '#8c6470', maxTicksLimit: 12 } },
            y: { grid: { color: 'rgba(196,99,122,0.08)' }, ticks: { color: '#8c6470', callback: (v: any) => 'R$' + v } }
          }
        }
      });
    });

    this.api.getSalesByPayment(d).subscribe(data => {
      if (this.pieChart) this.pieChart.destroy();
      if (!this.pieEl) return;
      const colors = ['#6c63ff','#00d4aa','#ff6b6b','#ffd93d','#ff9f43'];
      this.pieChart = new Chart(this.pieEl.nativeElement, {
        type: 'pie',
        data: {
          labels: data.map(x => x.payment_method),
          datasets: [{
            data: data.map(x => x.total),
            backgroundColor: colors.map(c => c + 'cc'),
            borderColor: colors, borderWidth: 2
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#8c6470' } } }
        }
      });
    });
  }

  catPct(c: SalesByCategory): number {
    const total = this.catSummary().reduce((a, x) => a + x.total, 0);
    return total ? (c.total / total) * 100 : 0;
  }

  formatCurrency(v: number) { return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }); }

  ngOnDestroy() { this.barChart?.destroy(); this.pieChart?.destroy(); }
}

// components/dashboard/dashboard.component.ts
import { Component, inject, signal, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { DashboardStats, Sale, Product } from '../../models';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="page-wrap fade-in">
  <div class="page-header">
    <div>
      <div class="page-title">Dashboard</div>
      <div class="page-sub">{{ today }}</div>
    </div>
    <a routerLink="/vendas" class="btn btn-primary">+ Nova Venda</a>
  </div>

  <!-- Stat cards -->
  <div class="stats-grid">
    <div class="stat-card purple">
      <div class="stat-icon">💰</div>
      <div class="stat-value">{{ formatCurrency(stats()?.this_month?.total ?? 0) }}</div>
      <div class="stat-label">Receita do Mês</div>
      <span class="stat-change" [class.up]="monthChange() >= 0" [class.down]="monthChange() < 0">
        {{ monthChange() >= 0 ? '▲' : '▼' }} {{ monthChange() | number:'1.1-1' }}%
      </span>
    </div>
    <div class="stat-card green">
      <div class="stat-icon">🧾</div>
      <div class="stat-value">{{ stats()?.this_month?.count ?? 0 }}</div>
      <div class="stat-label">Vendas do Mês</div>
    </div>
    <div class="stat-card yellow">
      <div class="stat-icon">💵</div>
      <div class="stat-value">{{ formatCurrency(stats()?.today_total ?? 0) }}</div>
      <div class="stat-label">Vendas Hoje</div>
    </div>
    <div class="stat-card red">
      <div class="stat-icon">⚠️</div>
      <div class="stat-value">{{ stats()?.low_stock_count ?? 0 }}</div>
      <div class="stat-label">Estoque Crítico</div>
    </div>
  </div>

  <!-- Charts row -->
  <div class="dash-grid">
    <div class="card">
      <div class="card-header"><span class="card-title">📈 Vendas por Dia (14 dias)</span></div>
      <div class="chart-wrap"><canvas #chartLine></canvas></div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">🏷️ Receita por Categoria</span></div>
      <div class="chart-wrap"><canvas #chartDoughnut></canvas></div>
    </div>
  </div>

  <!-- Lower row -->
  <div class="dash-grid">
    <div class="card">
      <div class="card-header">
        <span class="card-title">🕒 Vendas Recentes</span>
        <a routerLink="/historico" class="btn btn-ghost btn-sm">Ver todas</a>
      </div>
      @if (loadingSales()) {
        <div style="padding:30px;text-align:center;"><div class="spinner"></div></div>
      } @else {
        <table class="sf-table">
          <thead><tr><th>ID</th><th>Cliente</th><th>Total</th><th>Data</th><th>Pgto</th></tr></thead>
          <tbody>
            @for (s of recentSales(); track s.id) {
              <tr>
                <td class="mono">#{{ s.id }}</td>
                <td>{{ s.client_name }}</td>
                <td><strong class="mono">{{ formatCurrency(s.total) }}</strong></td>
                <td>{{ formatDate(s.created_at) }}</td>
                <td><span class="badge badge-info">{{ s.payment_method }}</span></td>
              </tr>
            }
            @empty {
              <tr><td colspan="5"><div class="empty-state"><div class="empty-icon">🛒</div><div class="empty-text">Nenhuma venda ainda</div></div></td></tr>
            }
          </tbody>
        </table>
      }
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">⚠️ Estoque Crítico</span>
        <a routerLink="/produtos" class="btn btn-ghost btn-sm">Gerenciar</a>
      </div>
      <div style="padding:10px 18px;">
        @for (p of lowStock(); track p.id) {
          <div class="ls-item">
            <div>
              <div style="font-size:14px;font-weight:500;">{{ p.name }}</div>
              <div class="stock-bar">
                <div class="fill" [style.width.%]="stockPct(p)" [style.background]="p.stock === 0 ? 'var(--danger)' : 'var(--warning)'"></div>
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:14px;font-weight:600;" [style.color]="p.stock === 0 ? 'var(--danger)' : 'var(--warning)'">
                {{ p.stock }} {{ p.unit }}
              </div>
              <div style="font-size:11px;color:var(--text3);">mín: {{ p.min_stock }}</div>
            </div>
          </div>
        }
        @empty {
          <div class="empty-state"><div class="empty-icon">✅</div><div class="empty-text">Todos os produtos OK</div></div>
        }
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 18px; margin-bottom: 22px; }
    .dash-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 18px; margin-bottom: 22px; }
    .ls-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 11px 0; border-bottom: 1px solid var(--border);
      &:last-child { border-bottom: none; }
    }
    @media (max-width: 1100px) { .stats-grid { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 800px)  { .dash-grid { grid-template-columns: 1fr; } }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private api = inject(ApiService);

  @ViewChild('chartLine')     lineEl!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartDoughnut') doughnutEl!: ElementRef<HTMLCanvasElement>;

  stats       = signal<DashboardStats | null>(null);
  recentSales = signal<Sale[]>([]);
  lowStock    = signal<Product[]>([]);
  loadingSales = signal(true);
  monthChange = signal(0);

  today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  private lineChart?: Chart;
  private doughnutChart?: Chart;

  ngOnInit() {
    this.api.getDashboardStats().subscribe(s => {
      this.stats.set(s);
      const last = s.last_month.total;
      const curr = s.this_month.total;
      this.monthChange.set(last ? +((curr - last) / last * 100).toFixed(1) : 0);
    });

    this.api.getSales().subscribe(s => {
      this.recentSales.set(s.slice(0, 7));
      this.loadingSales.set(false);
    });

    this.api.getLowStockProducts().subscribe(p => this.lowStock.set(p));
  }

  ngAfterViewInit() {
    this.loadCharts();
  }

  loadCharts() {
    this.api.getSalesByDay(14).subscribe(data => {
      if (this.lineChart) this.lineChart.destroy();
      const ctx = this.lineEl.nativeElement.getContext('2d')!;
      const grad = ctx.createLinearGradient(0, 0, 0, 200);
      grad.addColorStop(0, 'rgba(196,99,122,0.35)');
      grad.addColorStop(1, 'rgba(196,99,122,0)');

      this.lineChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map(d => d.day.slice(5).replace('-', '/')),
          datasets: [{
            label: 'Receita (R$)', data: data.map(d => d.total),
            borderColor: '#c4637a', backgroundColor: grad,
            fill: true, tension: 0.4, pointBackgroundColor: '#c4637a', pointRadius: 4
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: 'rgba(196,99,122,0.08)' }, ticks: { color: '#8c6470' } },
            y: { grid: { color: 'rgba(196,99,122,0.08)' }, ticks: { color: '#8c6470', callback: v => 'R$' + v } }
          }
        }
      });
    });

    this.api.getSalesByCategory(30).subscribe(data => {
      if (this.doughnutChart) this.doughnutChart.destroy();
      const filtered = data.filter(d => d.total > 0);
      this.doughnutChart = new Chart(this.doughnutEl.nativeElement, {
        type: 'doughnut',
        data: {
          labels: filtered.map(d => d.name),
          datasets: [{
            data: filtered.map(d => d.total),
            backgroundColor: filtered.map(d => d.color + 'cc'),
            borderColor: filtered.map(d => d.color),
            borderWidth: 2
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#8c6470', font: { size: 12 } } } }
        }
      });
    });
  }

  stockPct(p: Product): number {
    return Math.min(100, Math.round((p.stock / p.min_stock) * 100));
  }

  formatCurrency(v: number) {
    return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  }

  formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR');
  }

  ngOnDestroy() {
    this.lineChart?.destroy();
    this.doughnutChart?.destroy();
  }
}

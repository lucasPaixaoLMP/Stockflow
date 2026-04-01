// app.routes.ts
import { Routes } from '@angular/router';
import { authGuard, authChildGuard, guestGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
    loadComponent: () => import('./components/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      { path: 'dashboard',    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'vendas',       loadComponent: () => import('./components/sales/new-sale.component').then(m => m.NewSaleComponent) },
      { path: 'historico',    loadComponent: () => import('./components/sales/sale-history.component').then(m => m.SaleHistoryComponent) },
      { path: 'produtos',     loadComponent: () => import('./components/products/products.component').then(m => m.ProductsComponent) },
      { path: 'categorias',   loadComponent: () => import('./components/categories/categories.component').then(m => m.CategoriesComponent) },
      { path: 'relatorios',   loadComponent: () => import('./components/reports/reports.component').then(m => m.ReportsComponent) },
      { path: 'configuracoes',loadComponent: () => import('./components/settings/settings.component').then(m => m.SettingsComponent) },
      {
        path: 'usuarios',
        canActivate: [adminGuard],
        loadComponent: () => import('./components/users/users.component').then(m => m.UsersComponent)
      },
    ]
  },
  { path: '**', redirectTo: 'login' }
];

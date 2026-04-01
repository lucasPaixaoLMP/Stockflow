// services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Category, Product, Sale, DashboardStats,
  SalesByDay, SalesByCategory, TopProduct, SalesByPayment, User
} from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // ── Categories ─────────────────────────────────────────────
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>('/api/categories');
  }
  createCategory(data: Partial<Category>): Observable<Category> {
    return this.http.post<Category>('/api/categories', data);
  }
  updateCategory(id: number, data: Partial<Category>): Observable<Category> {
    return this.http.put<Category>(`/api/categories/${id}`, data);
  }
  deleteCategory(id: number): Observable<any> {
    return this.http.delete(`/api/categories/${id}`);
  }

  // ── Products ───────────────────────────────────────────────
  getProducts(search?: string, categoryId?: number): Observable<Product[]> {
    let params = new HttpParams();
    if (search)     params = params.set('search', search);
    if (categoryId) params = params.set('category_id', categoryId);
    return this.http.get<Product[]>('/api/products', { params });
  }
  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`/api/products/${id}`);
  }
  createProduct(data: Partial<Product>): Observable<Product> {
    return this.http.post<Product>('/api/products', data);
  }
  updateProduct(id: number, data: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`/api/products/${id}`, data);
  }
  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`/api/products/${id}`);
  }
  getLowStockProducts(): Observable<Product[]> {
    return this.http.get<Product[]>('/api/products/alerts/low-stock');
  }

  // ── Sales ──────────────────────────────────────────────────
  getSales(filters?: { start?: string; end?: string; payment_method?: string }): Observable<Sale[]> {
    let params = new HttpParams();
    if (filters?.start)          params = params.set('start', filters.start);
    if (filters?.end)            params = params.set('end', filters.end);
    if (filters?.payment_method) params = params.set('payment_method', filters.payment_method);
    return this.http.get<Sale[]>('/api/sales', { params });
  }
  getSale(id: number): Observable<Sale> {
    return this.http.get<Sale>(`/api/sales/${id}`);
  }
  createSale(data: Partial<Sale>): Observable<Sale> {
    return this.http.post<Sale>('/api/sales', data);
  }
  deleteSale(id: number): Observable<any> {
    return this.http.delete(`/api/sales/${id}`);
  }

  // ── Dashboard ──────────────────────────────────────────────
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>('/api/dashboard/stats');
  }
  getSalesByDay(days = 14): Observable<SalesByDay[]> {
    return this.http.get<SalesByDay[]>(`/api/reports/sales-by-day?days=${days}`);
  }
  getSalesByCategory(days = 30): Observable<SalesByCategory[]> {
    return this.http.get<SalesByCategory[]>(`/api/reports/sales-by-category?days=${days}`);
  }

  // ── Reports ────────────────────────────────────────────────
  getTopProducts(days = 30): Observable<TopProduct[]> {
    return this.http.get<TopProduct[]>(`/api/reports/top-products?days=${days}`);
  }
  getSalesByPayment(days = 30): Observable<SalesByPayment[]> {
    return this.http.get<SalesByPayment[]>(`/api/reports/sales-by-payment?days=${days}`);
  }
  getReportSalesByDay(days = 30): Observable<SalesByDay[]> {
    return this.http.get<SalesByDay[]>(`/api/reports/sales-by-day?days=${days}`);
  }
  getReportSalesByCategory(days = 30): Observable<SalesByCategory[]> {
    return this.http.get<SalesByCategory[]>(`/api/reports/sales-by-category?days=${days}`);
  }

  // ── Users ──────────────────────────────────────────────────
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/users');
  }
  deleteUser(id: number): Observable<any> {
    return this.http.delete(`/api/users/${id}`);
  }
}

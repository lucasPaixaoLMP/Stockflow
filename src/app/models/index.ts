// models/index.ts
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'vendedor';
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  product_count?: number;
  created_at: string;
}

export interface Product {
  id: number;
  owner_id: number;
  name: string;
  description?: string;
  category_id?: number;
  category_name?: string;
  category_color?: string;
  unit: string;
  cost_price: number;
  sale_price: number;
  stock: number;
  min_stock: number;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id?: number;
  sale_id?: number;
  product_id?: number;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface Sale {
  id: number;
  owner_id: number;
  client_name: string;
  payment_method: string;
  total: number;
  seller_name?: string;
  items: SaleItem[];
  created_at: string;
}

export interface DashboardStats {
  this_month:      { total: number; count: number };
  last_month:      { total: number; count: number };
  total_products:  number;
  low_stock_count: number;
  today_total:     number;
}

export interface SalesByDay {
  day:   string;
  total: number;
  count: number;
}

export interface SalesByCategory {
  name:  string;
  color: string;
  total: number;
  qty:   number;
}

export interface TopProduct {
  product_name:   string;
  total_qty:      number;
  total_revenue:  number;
}

export interface SalesByPayment {
  payment_method: string;
  count:          number;
  total:          number;
}

export interface Toast {
  id:      number;
  message: string;
  type:    'success' | 'error' | 'warning';
}

import { z } from 'zod';

// ============================================
// Zod Schemas (for validation)
// ============================================

export const ProductSchema = z.object({
  product_name: z.string().min(1, 'Nama produk wajib diisi'),
  variant: z.string().optional().default(''),
  status: z.enum(['live', 'development'], { message: 'Status wajib dipilih' }),
  category: z.string().min(1, 'Kategori wajib diisi'),
  nutrition_highlight: z.string().optional().default(''),
  cogs: z.coerce.number().min(0, 'COGS harus angka positif'),
});

export const TrendSchema = z.object({
  trend_name: z.string().min(1, 'Nama tren wajib diisi'),
  target_market: z.string().min(1, 'Target market wajib diisi'),
  competitor_price: z.coerce.number().min(0, 'Harga kompetitor harus angka positif'),
  trend_status: z.enum(['naik', 'turun', 'stabil'], { message: 'Status tren wajib dipilih' }),
});

export const PackagingSchema = z.object({
  target_product: z.string().min(1, 'Target produk wajib diisi'),
  packaging_type: z.enum(['Standing Pouch', 'Box', 'Jar', 'Sachet', 'Lainnya'], { message: 'Tipe packaging wajib dipilih' }),
  material_specs: z.string().min(1, 'Spesifikasi material wajib diisi'),
  current_trend: z.string().optional().default(''),
  visual_reference_url: z.string().url('URL harus valid').optional().or(z.literal('')).default(''),
  moq: z.coerce.number().min(0, 'MOQ harus angka positif'),
  price_per_pcs: z.coerce.number().min(0, 'Harga per pcs harus angka positif'),
  qty_per_carton: z.coerce.number().min(0, 'Qty per karton harus angka positif'),
  arrangement_layout: z.string().optional().default(''),
});

// ============================================
// TypeScript Interfaces
// ============================================

export interface Product {
  product_id: string;
  product_name: string;
  variant: string;
  status: 'live' | 'development';
  category: string;
  nutrition_highlight: string;
  cogs: number;
  created_at: string;
}

export interface MarketTrend {
  trend_id: string;
  trend_name: string;
  target_market: string;
  competitor_price: number;
  trend_status: 'naik' | 'turun' | 'stabil';
  created_at: string;
}

export interface PackagingAnalysis {
  packaging_id: string;
  target_product: string;
  packaging_type: 'Standing Pouch' | 'Box' | 'Jar' | 'Sachet' | 'Lainnya';
  material_specs: string;
  current_trend: string;
  visual_reference_url: string;
  moq: number;
  price_per_pcs: number;
  qty_per_carton: number;
  arrangement_layout: string;
  created_at: string;
}

// ============================================
// NEW: On Progress Product (R&D Tracking)
// ============================================

export interface OnProgressProduct {
  id: string;
  nama_produk: string;
  kategori: string;
  fase_development: string;
  target_rilis: string;
  catatan_formulasi: string;
  foto_produk_url: string;
  rangkaian_produk: string;
  ukuran_produk: string;
  mockup_url: string;
  ai_forecast: string;
  ai_lifespan: string;
  timestamp: string;
  tanggal_selesai?: string;
}

// ============================================
// NEW: Input Informasi (Deep Research)
// ============================================

export interface InputInformation {
  info_id: string;
  judul: string;
  kategori_info: string;
  sumber: string;
  konten: string;
  created_at: string;
}

// ============================================
// NEW: Sales Data (Penjualan Harian)
// ============================================

export interface SalesDataEntry {
  tanggal: string;
  barcode_produk: string;
  sku_produk: string;
  nama_barang: string;
  qty: number;
}

export interface ProductSalesSummary {
  nama_barang: string;
  sku_produk: string;
  barcode_produk: string;
  total_qty: number;
  daily_data: { tanggal: string; qty: number }[];
  image_url?: string;
}

// ============================================
// NEW: AI Trend Analysis
// ============================================

export interface AiTrendProduct {
  nama_produk: string;
  marketplace: string;
  alasan_trending: string;
  estimasi_durasi: string;
  rekomendasi: string;
  skor_trend: number;
}

export interface AiTrendAnalysis {
  products: AiTrendProduct[];
  insight_utama: string;
  rekomendasi_bisnis: string;
  updated_at: string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalTrends: number;
  totalPackaging: number;
  liveProducts: number;
  trendNaik: number;
}

// ============================================
// Navigation Types
// ============================================

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  section?: 'main' | 'admin';
}

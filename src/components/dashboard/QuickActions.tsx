'use client';

import { TrendingUp, Package, FlaskConical, ShoppingCart } from 'lucide-react';
import { useState } from 'react';

interface QuickActionModalProps {
  type: 'trending' | 'live-sku' | 'on-develop' | 'sales';
  onClose: () => void;
}

interface Field {
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
}

interface ActionConfig {
  title: string;
  endpoint: string;
  fields: Field[];
}

function QuickActionModal({ type, onClose }: QuickActionModalProps) {
  const config: Record<'trending' | 'live-sku' | 'on-develop' | 'sales', ActionConfig> = {
    trending: {
      title: 'Tambah Produk Trending',
      endpoint: '/api/products/market-watch',
      fields: [
        { name: 'tipe_trend', label: 'Tipe Trend', type: 'select', options: ['Trend Produk', 'Trend Packaging Unik'], required: true },
        { name: 'nama_produk', label: 'Nama Item / Produk', type: 'text', required: true },
        { name: 'link_medsos', label: 'Link Referensi/Video (TikTok/IG)', type: 'url', required: true },
        { name: 'ukuran_gramasi', label: 'Ukuran / Gramasi', type: 'text', required: true },
        { name: 'harga_referensi', label: 'Harga Referensi Pasar', type: 'text', required: false },
      ],
    },
    'live-sku': {
      title: 'Tambah SKU Produk Live',
      endpoint: '/api/products/live',
      fields: [
        { name: 'barcode_produk', label: 'Barcode Produk', type: 'text', required: true },
        { name: 'sku_produk', label: 'SKU Produk', type: 'text', required: true },
        { name: 'sku_per_produk', label: 'SKU Per Produk', type: 'text', required: false },
        { name: 'nama_barang', label: 'Nama Barang', type: 'text', required: true },
        { name: 'qty', label: 'Qty', type: 'number', required: true },
        { name: 'image_url', label: 'URL Gambar Produk', type: 'url', required: false },
      ],
    },
    'on-develop': {
      title: 'Tambah Produk On Develop',
      endpoint: '/api/products/on-progress',
      fields: [
        { name: 'nama_produk', label: 'Nama Produk (Proyek)', type: 'text', required: true },
        { name: 'kategori', label: 'Kategori', type: 'select', options: ['Kurma', 'Kacang', 'Ekstrak', 'Trail Mix', 'Madu', 'Cokelat', 'Lainnya'], required: true },
        { name: 'fase_development', label: 'Fase Saat Ini', type: 'select', options: ['Ideation', 'Formulation', 'Lab Testing', 'Packaging Design', 'Final Review'], required: true },
        { name: 'target_rilis', label: 'Target Rilis', type: 'date', required: true },
        { name: 'catatan_formulasi', label: 'Catatan R&D', type: 'textarea', required: false },
      ],
    },
    'sales': {
      title: 'Masukan Data Penjualan',
      endpoint: '/api/sales-data',
      fields: [
        { name: 'tanggal', label: 'Tanggal Pesanan', type: 'date', required: true },
        { name: 'barcode_produk', label: 'Barcode Produk', type: 'text', required: true },
        { name: 'sku_produk', label: 'SKU Produk', type: 'text', required: false },
        { name: 'nama_barang', label: 'Nama Barang', type: 'text', required: true },
        { name: 'qty', label: 'Qty Terjual', type: 'number', required: true },
        { name: 'platform', label: 'Platform Penjualan', type: 'select', options: ['TikTok', 'Shopee', 'Tokopedia', 'Offline', 'Lainnya'], required: true },
      ],
    },
  };

  const modalConfig = config[type];
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(modalConfig.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => onClose(), 1500);
      }
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{modalConfig.title}</h2>
          <p className="text-sm text-gray-500 mt-1">Isi data di bawah lalu simpan</p>
        </div>

        {success ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-900">Berhasil Disimpan!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {modalConfig.fields.map((field) => (
              <div key={field.name}>
                <label className="form-label">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === 'select' ? (
                  <select
                    className="form-select"
                    required={field.required}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  >
                    <option value="">Pilih...</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    className="form-input min-h-[80px] resize-y"
                    required={field.required}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  />
                ) : (
                  <input
                    type={field.type}
                    className="form-input"
                    required={field.required}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  />
                )}
              </div>
            ))}

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">
                Batal
              </button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading 
                  ? (type === 'trending' ? 'AI Sedang Meriset...' : 'Menyimpan...') 
                  : (type === 'trending' ? 'Simpan & Analisa AI' : 'Simpan')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function QuickActions() {
  const [activeModal, setActiveModal] = useState<'trending' | 'live-sku' | 'on-develop' | 'sales' | null>(null);

  const actions = [
    {
      key: 'trending' as const,
      label: 'Tambah Produk Trending',
      desc: 'Input data tren pasar baru',
      icon: TrendingUp,
      gradient: 'from-amber-500 to-orange-500',
      glow: 'shadow-amber-500/20',
      iconBg: 'bg-amber-400/20',
    },
    {
      key: 'live-sku' as const,
      label: 'Tambah SKU Baru Live',
      desc: 'Daftarkan SKU produk baru ke Master',
      icon: Package,
      gradient: 'from-emerald-500 to-teal-500',
      glow: 'shadow-emerald-500/20',
      iconBg: 'bg-emerald-400/20',
    },
    {
      key: 'on-develop' as const,
      label: 'Tambah Produk On Develop',
      desc: 'Catat progress R&D produk baru',
      icon: FlaskConical,
      gradient: 'from-violet-500 to-purple-500',
      glow: 'shadow-violet-500/20',
      iconBg: 'bg-violet-400/20',
    },
    {
      key: 'sales' as const,
      label: 'Masukan Data Penjualan',
      desc: 'Input penjualan untuk AI analisis',
      icon: ShoppingCart,
      gradient: 'from-blue-500 to-indigo-500',
      glow: 'shadow-blue-500/20',
      iconBg: 'bg-blue-400/20',
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.key}
              onClick={() => setActiveModal(action.key)}
              className={`relative group bg-gradient-to-br ${action.gradient} text-white rounded-2xl p-5 shadow-lg ${action.glow} hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-left overflow-hidden`}
            >
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform duration-300" />

              <div className={`w-10 h-10 ${action.iconBg} rounded-xl flex items-center justify-center mb-3 relative z-10`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-sm relative z-10">{action.label}</h3>
              <p className="text-xs text-white/70 mt-1 relative z-10">{action.desc}</p>
            </button>
          );
        })}
      </div>

      {activeModal && (
        <QuickActionModal type={activeModal} onClose={() => setActiveModal(null)} />
      )}
    </>
  );
}

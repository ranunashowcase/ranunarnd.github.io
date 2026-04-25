'use client';

import { TrendingUp, Package, FlaskConical, ShoppingCart, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useState, useRef, useCallback } from 'react';

interface QuickActionModalProps {
  type: 'trending' | 'live-sku' | 'on-develop';
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
  const config: Record<'trending' | 'live-sku' | 'on-develop', ActionConfig> = {
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

// ====================================================
// Sales Upload Modal — Excel/CSV file upload
// ====================================================
function SalesUploadModal({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    imported?: number;
    skipped?: number;
    columns_detected?: Record<string, string>;
    error?: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      setFile(droppedFile);
      setResult(null);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/sales-data/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setResult(data);

      if (data.success) {
        // Auto close after 3 seconds on success
        setTimeout(() => onClose(), 3000);
      }
    } catch {
      setResult({ success: false, error: 'Gagal mengunggah file. Periksa koneksi Anda.' });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Upload Data Penjualan</h2>
              <p className="text-sm text-gray-500 mt-1">Upload file Excel penjualan harian</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Success State */}
          {result?.success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-2">Import Berhasil!</p>
              <p className="text-sm text-gray-500">{result.message}</p>

              {/* Column detection info */}
              {result.columns_detected && (
                <div className="mt-4 bg-gray-50 rounded-xl p-4 text-left">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Kolom Terdeteksi</p>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {Object.entries(result.columns_detected).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-1.5">
                        <span className="text-gray-400">{key}:</span>
                        <span className="text-gray-700 font-medium truncate">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-blue-400 bg-blue-50/50 scale-[1.02]'
                    : file
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : 'border-gray-200 bg-gray-50/50 hover:border-blue-300 hover:bg-blue-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center">
                      <FileSpreadsheet className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
                      className="text-xs text-red-500 hover:text-red-600 font-medium"
                    >
                      Ganti file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                      <Upload className="w-7 h-7 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">
                        Drag & drop file Excel di sini
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        atau <span className="text-blue-500 font-medium">klik untuk pilih file</span>
                      </p>
                    </div>
                    <p className="text-[10px] text-gray-300 mt-1">
                      Mendukung .xlsx, .xls, .csv
                    </p>
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-700 mb-2">📋 Format Kolom yang Didukung</p>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-blue-600">
                  <span>• Tanggal / Date</span>
                  <span>• Barcode</span>
                  <span>• SKU / Nomor Referensi</span>
                  <span>• Nama Produk / Barang</span>
                  <span>• Qty / Jumlah</span>
                  <span>• Platform / Marketplace</span>
                </div>
                <p className="text-[10px] text-blue-400 mt-2">
                  Sistem akan otomatis mendeteksi kolom berdasarkan header Excel Anda
                </p>
              </div>

              {/* Error */}
              {result && !result.success && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">Gagal Import</p>
                    <p className="text-xs text-red-500 mt-1">{result.error}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="btn-ghost flex-1">
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!file || loading}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                      </svg>
                      Mengimpor data...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload & Import
                    </span>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
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
      label: 'Upload Data Penjualan',
      desc: 'Import Excel penjualan harian',
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

      {/* Regular modals for trending, live-sku, on-develop */}
      {activeModal && activeModal !== 'sales' && (
        <QuickActionModal type={activeModal} onClose={() => setActiveModal(null)} />
      )}

      {/* Sales upload modal */}
      {activeModal === 'sales' && (
        <SalesUploadModal onClose={() => setActiveModal(null)} />
      )}
    </>
  );
}

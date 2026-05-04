'use client';

import { useEffect, useState, useCallback } from 'react';
import { FlaskConical, Loader2, Plus, Image, Layers, Ruler, FileImage, Clock, BrainCircuit, X, ChevronRight, ChevronLeft, Edit, Trash2, CheckCircle2, RefreshCw, Search, TrendingUp, ShieldAlert, Target, Users, BarChart3, Microscope, Maximize2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { OnProgressProduct } from '@/types';
import { useToast } from '@/components/ui/Toast';
import { getDirectImageUrl } from '@/lib/utils';

const phases = [
  { key: 'Ideation', label: '💡 Ideation', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'Formulation', label: '🧪 Formulation', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { key: 'Lab Testing', label: '🔬 Lab Testing', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { key: 'Packaging Design', label: '📦 Packaging Design', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { key: 'Final Review', label: '✅ Final Review', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { key: 'Selesai', label: '🎉 Selesai', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
];

function getLatestPhase(faseStr: string): string {
  if (!faseStr) return 'Ideation';
  const checked = faseStr.split(',').map(s => s.trim());
  let latestIdx = -1;
  let latestName = checked[0] || '';
  checked.forEach(c => {
    const idx = phases.findIndex(p => p.key === c);
    if (idx > latestIdx) {
      latestIdx = idx;
      latestName = c;
    }
  });
  return latestName;
}

function getPhaseColor(fase: string): string {
  const phaseName = getLatestPhase(fase);
  const phase = phases.find((p) => phaseName.toLowerCase().includes(p.key.toLowerCase()));
  return phase?.color || phases[0].color;
}

// Research data interface
interface ResearchData {
  analisis_pasar: string;
  kompetitor: string;
  target_market: string;
  trend_forecast: string;
  rekomendasi_strategi: string;
  risk_assessment: string;
  estimated_lifespan: string;
  skor_potensi: number;
  verdict: string;
}

interface ResearchMeta {
  created_at: string | null;
  last_refreshed_at: string | null;
  refresh_remaining: number;
}

export default function OnProgressPage() {
  const [products, setProducts] = useState<OnProgressProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<OnProgressProduct | null>(null);
  const { showToast } = useToast();

  // Research state
  const [research, setResearch] = useState<ResearchData | null>(null);
  const [researchMeta, setResearchMeta] = useState<ResearchMeta | null>(null);
  const [researchLoading, setResearchLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fullscreen image viewer state
  const [viewerImages, setViewerImages] = useState<{title: string; url: string}[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [showViewer, setShowViewer] = useState(false);
  const [viewerScale, setViewerScale] = useState(1);
  const [viewerPan, setViewerPan] = useState({x: 0, y: 0});
  const [viewerDragging, setViewerDragging] = useState(false);
  const [dragStart, setDragStart] = useState({x: 0, y: 0});

  const fetchData = () => {
    setLoading(true);
    fetch('/api/products/on-progress')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setProducts(json.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // Fetch research when a product is selected
  const fetchResearch = useCallback(async (productId: string) => {
    setResearchLoading(true);
    setResearch(null);
    setResearchMeta(null);
    try {
      const res = await fetch(`/api/products/on-progress/research?id=${productId}`);
      const json = await res.json();
      if (json.success) {
        setResearch(json.data);
        setResearchMeta(json.meta);
      }
    } catch {
      console.error('Failed to fetch research');
    } finally {
      setResearchLoading(false);
    }
  }, []);

  // Refresh research (manual, limited 2x/day)
  const handleRefreshResearch = async (productId: string) => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const res = await fetch('/api/products/on-progress/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      });
      const json = await res.json();
      if (json.success) {
        setResearch(json.data);
        setResearchMeta(json.meta);
        showToast('Riset berhasil di-refresh!', 'success');
      } else {
        showToast(json.error || 'Gagal refresh riset', 'error');
      }
    } catch {
      showToast('Error koneksi saat refresh riset', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  // When selectedProduct changes, fetch research
  useEffect(() => {
    if (selectedProduct?.id) {
      fetchResearch(selectedProduct.id);
    } else {
      setResearch(null);
      setResearchMeta(null);
    }
  }, [selectedProduct, fetchResearch]);

  useEffect(() => { fetchData(); }, []);

  // Fetch gallery images from Supabase for fullscreen viewer
  const openFullscreenViewer = async (code: string, startIndex = 0) => {
    try {
      const SUPABASE_URL = 'https://vojohaceijgiotlnnkda.supabase.co';
      const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvam9oYWNlaWpnaW90bG5ua2RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NjQyNjgsImV4cCI6MjA5MzQ0MDI2OH0.bfPdCT_ht3NU9EYk7Ku43kvT6uL7sx0S3758Apg7ESI';
      const res = await fetch(`${SUPABASE_URL}/rest/v1/gallery_images?code=eq.${encodeURIComponent(code)}&order=created_at.asc&select=title,image_url`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        setViewerImages(data.map((d: {title: string; image_url: string}) => ({ title: d.title, url: d.image_url })));
        setViewerIndex(startIndex < data.length ? startIndex : 0);
        setViewerScale(1);
        setViewerPan({x: 0, y: 0});
        setShowViewer(true);
      }
    } catch {
      console.error('Failed to fetch gallery images');
    }
  };

  const viewerResetZoom = () => { setViewerScale(1); setViewerPan({x: 0, y: 0}); };
  const viewerNav = (dir: number) => {
    const newIdx = (viewerIndex + dir + viewerImages.length) % viewerImages.length;
    setViewerIndex(newIdx);
    setViewerScale(1);
    setViewerPan({x: 0, y: 0});
  };

  // Form state
  const [formData, setFormData] = useState({
    id: '', nama_produk: '', kategori: 'Kurma', fase_development: 'Ideation',
    target_rilis: '', catatan_formulasi: '', foto_produk_url: '', // foto_produk_url now used for Kode Unik
    rangkaian_produk: '', ukuran_produk: '', mockup_url: '', tanggal_selesai: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const openForm = (product?: OnProgressProduct) => {
    if (product) {
      setFormData({
        id: product.id || '', nama_produk: product.nama_produk || '', kategori: product.kategori || 'Kurma',
        fase_development: product.fase_development || 'Ideation', target_rilis: product.target_rilis || '',
        catatan_formulasi: product.catatan_formulasi || '', foto_produk_url: product.foto_produk_url || '',
        rangkaian_produk: product.rangkaian_produk || '', ukuran_produk: product.ukuran_produk || '',
        mockup_url: product.mockup_url || '', tanggal_selesai: product.tanggal_selesai || ''
      });
      setIsEditMode(true);
    } else {
      setFormData({ id: '', nama_produk: '', kategori: 'Kurma', fase_development: 'Ideation', target_rilis: '', catatan_formulasi: '', foto_produk_url: '', rangkaian_produk: '', ukuran_produk: '', mockup_url: '', tanggal_selesai: '' });
      setIsEditMode(false);
    }
    setShowForm(true);
    setSelectedProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const method = isEditMode ? 'PUT' : 'POST';
      const res = await fetch('/api/products/on-progress', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        showToast(isEditMode ? 'Proyek berhasil diupdate!' : 'Produk On Progress berhasil ditambahkan!', 'success');
        setShowForm(false);
        setFormData({ id: '', nama_produk: '', kategori: 'Kurma', fase_development: 'Ideation', target_rilis: '', catatan_formulasi: '', foto_produk_url: '', rangkaian_produk: '', ukuran_produk: '', mockup_url: '', tanggal_selesai: '' });
        fetchData();
      } else {
        showToast(data.error || 'Gagal menyimpan', 'error');
      }
    } catch {
      showToast('Koneksi error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;
    try {
      const res = await fetch(`/api/products/on-progress?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Berhasil dihapus', 'success');
        setSelectedProduct(null);
        fetchData();
      } else {
        showToast(data.error || 'Gagal menghapus', 'error');
      }
    } catch {
      showToast('Error koneksi', 'error');
    }
  };

  const handleMarkCompleted = async (product: OnProgressProduct) => {
    if (!confirm('Tandai produk ini sebagai selesai hari ini?')) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const allPhasesStr = phases.map(p => p.key).join(', ');
      const payload = { ...product, fase_development: allPhasesStr, tanggal_selesai: today };
      const res = await fetch('/api/products/on-progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Produk ditandai selesai!', 'success');
        setSelectedProduct(null);
        fetchData();
      } else {
        showToast('Gagal menandai selesai', 'error');
      }
    } catch {
      showToast('Error koneksi', 'error');
    }
  };

  const categories = ['Kurma', 'Kacang', 'Ekstrak', 'Trail Mix', 'Madu', 'Cokelat', 'Lainnya'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produk On Progress</h1>
          <p className="text-sm text-gray-400 mt-1">
            Tracking produk R&D baru — {products.length} proyek
          </p>
        </div>
        <button onClick={() => openForm()} className="btn-primary">
          <Plus className="w-4 h-4" />
          Tambah Proyek
        </button>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <FlaskConical className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-1">Belum Ada Proyek R&D</h3>
          <p className="text-sm text-gray-400 mb-4">Mulai dengan menambahkan proyek R&D pertama</p>
          <button onClick={() => openForm()} className="btn-primary">
            <Plus className="w-4 h-4" /> Tambah Proyek Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {products.map((product, i) => {
            const checkedPhases = (product.fase_development || '').split(',').map(s => s.trim()).filter(Boolean);
            const progress = (checkedPhases.length / phases.length) * 100;
            const latestPhaseName = getLatestPhase(product.fase_development);

            return (
              <div
                key={product.id || i}
                className="bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden cursor-pointer group"
                onClick={() => setSelectedProduct(product)}
              >
                {/* Kode Unik Header */}
                {product.foto_produk_url && (
                  <div className="h-40 bg-gradient-to-br from-blue-50 to-indigo-50 relative flex flex-col border-b border-gray-100 overflow-hidden group-hover:opacity-90 transition-opacity">
                    <iframe 
                        src={`https://galerirndranuna.vercel.app/?preview=${product.foto_produk_url}`}
                        className="w-full h-full border-0 pointer-events-none absolute inset-0 z-0"
                        title="Galeri Produk Preview"
                    />
                    <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1">
                      <span className="px-2 py-1 bg-white/90 backdrop-blur-md rounded-md text-[10px] font-bold text-blue-700 tracking-wider shadow-sm border border-white/50 flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {product.foto_produk_url}
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-5">
                  {/* Phase badge */}
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${getPhaseColor(product.fase_development)} mb-3`}>
                    {latestPhaseName} ({checkedPhases.length}/{phases.length})
                  </span>

                  <h3 className="text-sm font-bold text-gray-900 mb-1">{product.nama_produk}</h3>
                  <p className="text-xs text-gray-400 mb-4">{product.kategori}</p>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-400">Progress</span>
                      <span className="text-[10px] font-semibold text-brand-primary">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-primary-light transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {/* Phase dots */}
                    <div className="flex items-center justify-between mt-1.5 min-w-full">
                      {phases.map((phase) => {
                        const isChecked = checkedPhases.includes(phase.key);
                        return (
                          <div
                            key={phase.key}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              isChecked ? 'bg-brand-primary' : 'bg-gray-200'
                            }`}
                            title={phase.label}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Target & Selesai */}
                  <div className="flex flex-col gap-1 text-xs text-gray-400">
                    {product.target_rilis && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> Target: {product.target_rilis}
                      </div>
                    )}
                    {checkedPhases.includes('Selesai') && product.tanggal_selesai && (
                      <div className="flex items-center gap-1.5 text-indigo-500 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Selesai: {product.tanggal_selesai}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{isEditMode ? 'Update Proyek R&D' : 'Tambah Proyek R&D Baru'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Nama Produk <span className="text-red-500">*</span></label>
                  <input type="text" className="form-input" required value={formData.nama_produk} onChange={(e) => setFormData({ ...formData, nama_produk: e.target.value })} placeholder="Contoh: Kurma Pistachio Cokelat" />
                </div>
                <div>
                  <label className="form-label">Kategori</label>
                  <select className="form-select" value={formData.kategori} onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label mb-2 block">Fase Development (Checklist)</label>
                  <div className="grid grid-cols-2 gap-2 border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                    {phases.map((p) => {
                      const isChecked = (formData.fase_development || '').includes(p.key);
                      return (
                        <label key={p.key} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-gray-900 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={isChecked} 
                            onChange={() => {
                              const current = (formData.fase_development || '').split(',').map(s => s.trim()).filter(Boolean);
                              if (current.includes(p.key)) {
                                setFormData({ ...formData, fase_development: current.filter(c => c !== p.key).join(', ') });
                              } else {
                                setFormData({ ...formData, fase_development: [...current, p.key].join(', ') });
                              }
                            }} 
                            className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary cursor-pointer w-4 h-4" 
                          />
                          {p.label}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="form-label">Target Rilis</label>
                  <input type="date" className="form-input" value={formData.target_rilis} onChange={(e) => setFormData({ ...formData, target_rilis: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="form-label flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Kode Unik Produk (Untuk Galeri)</label>
                <input 
                  type="text"
                  className="form-input text-sm uppercase" 
                  placeholder="Misal: RND-ALPHA-01" 
                  value={formData.foto_produk_url} 
                  onChange={(e) => setFormData({ ...formData, foto_produk_url: e.target.value.toUpperCase() })} 
                />
                <p className="text-[10px] text-gray-400 mt-1">Masukkan kode unik untuk dihubungkan dengan web Galeri Produk R&D.</p>
              </div>

              <div>
                <label className="form-label flex items-center gap-1.5"><FileImage className="w-3.5 h-3.5" /> URL Full Appearance (PDF/Drive)</label>
                <input type="url" className="form-input" placeholder="https://drive.google.com/... (Berisi mockup lengkap)" value={formData.mockup_url} onChange={(e) => setFormData({ ...formData, mockup_url: e.target.value })} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Rangkaian/Komposisi Produk</label>
                  <textarea className="form-input min-h-[60px] resize-y" placeholder="Kurma Ajwa, Dark Cokelat Belgium, Pistachio..." value={formData.rangkaian_produk} onChange={(e) => setFormData({ ...formData, rangkaian_produk: e.target.value })} />
                </div>
                <div>
                  <label className="form-label flex items-center gap-1.5"><Ruler className="w-3.5 h-3.5" /> Ukuran Produk</label>
                  <input type="text" className="form-input" placeholder="250gr / 500ml / 100pcs" value={formData.ukuran_produk} onChange={(e) => setFormData({ ...formData, ukuran_produk: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="form-label">Catatan R&D / Formulasi</label>
                <textarea className="form-input min-h-[80px] resize-y" placeholder="Progress terkini, hasil sampel, catatan..." value={formData.catatan_formulasi} onChange={(e) => setFormData({ ...formData, catatan_formulasi: e.target.value })} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">Batal</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> AI Sedang Menganalisa...</> : <><BrainCircuit className="w-4 h-4" /> Simpan & Analisa AI</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedProduct(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
            {/* Galeri Kode Unik Integration */}
            {selectedProduct.foto_produk_url && (
              <div className="bg-white rounded-t-2xl border-b border-gray-100 flex flex-col">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 flex items-center justify-between text-white rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Layers className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xs text-blue-200 font-medium uppercase tracking-wider mb-0.5">Galeri Produk R&D</h3>
                      <div className="font-bold tracking-wide">
                        {selectedProduct.foto_produk_url}
                      </div>
                    </div>
                  </div>
                  <a 
                    href={`https://galerirndranuna.vercel.app/?code=${selectedProduct.foto_produk_url}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm transition-colors border border-white/10"
                  >
                    Buka Penuh <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
                
                {/* Embedded Gallery iframe */}
                <div className="w-full bg-gray-50 h-[280px] relative">
                   <iframe 
                      src={`https://galerirndranuna.vercel.app/?embed=${selectedProduct.foto_produk_url}`}
                      className="w-full h-full border-0"
                      title="Galeri Produk"
                   />
                   {/* Fullscreen button overlay */}
                   <button
                     onClick={() => openFullscreenViewer(selectedProduct.foto_produk_url)}
                     className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white text-xs font-medium rounded-lg backdrop-blur-sm transition-all shadow-lg border border-white/10"
                     title="Lihat Fullscreen"
                   >
                     <Maximize2 className="w-3.5 h-3.5" />
                     Fullscreen
                   </button>
                </div>
              </div>
            )}

            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${getPhaseColor(selectedProduct.fase_development)} mb-2`}>
                    {getLatestPhase(selectedProduct.fase_development)} ({(selectedProduct.fase_development || '').split(',').filter(Boolean).length}/{phases.length})
                  </span>
                  <h2 className="text-xl font-bold text-gray-900">{selectedProduct.nama_produk}</h2>
                  <p className="text-sm text-gray-400">{selectedProduct.kategori}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!(selectedProduct.fase_development || '').includes('Selesai') && (
                    <button onClick={() => handleMarkCompleted(selectedProduct)} className="p-2 hover:bg-indigo-50 rounded-lg text-indigo-600 transition-colors" title="Tandai Selesai">
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  )}
                  <button onClick={() => openForm(selectedProduct)} className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors" title="Update Proyek">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(selectedProduct.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors" title="Hapus Proyek">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <div className="w-px h-6 bg-gray-200 mx-1"></div>
                  <button onClick={() => setSelectedProduct(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4">
                {selectedProduct.target_rilis && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Target Rilis</p>
                    <p className="text-sm font-medium text-gray-700">{selectedProduct.target_rilis}</p>
                  </div>
                )}
                {selectedProduct.ukuran_produk && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Ukuran</p>
                    <p className="text-sm font-medium text-gray-700">{selectedProduct.ukuran_produk}</p>
                  </div>
                )}
                {selectedProduct.tanggal_selesai && (
                  <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100">
                    <p className="text-[10px] text-indigo-400 uppercase tracking-wider font-bold mb-1">Tanggal Selesai</p>
                    <p className="text-sm font-bold text-indigo-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> {selectedProduct.tanggal_selesai}
                    </p>
                  </div>
                )}
              </div>

              {selectedProduct.rangkaian_produk && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Rangkaian/Komposisi</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedProduct.rangkaian_produk}</p>
                </div>
              )}

              {selectedProduct.catatan_formulasi && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Catatan R&D</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedProduct.catatan_formulasi}</p>
                </div>
              )}

              {/* ======================================== */}
              {/* AI Deep Research Section */}
              {/* ======================================== */}
              <div className="border-t border-gray-100 pt-5 mt-2">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                      <Microscope className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">AI Deep Research</h3>
                      <p className="text-[10px] text-gray-400">Riset mendalam otomatis oleh AI</p>
                    </div>
                  </div>

                  {/* Refresh button */}
                  {research && researchMeta && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">
                        {researchMeta.refresh_remaining}/{2} refresh tersisa
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRefreshResearch(selectedProduct.id);
                        }}
                        disabled={refreshing || researchMeta.refresh_remaining <= 0}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 ${
                          researchMeta.refresh_remaining <= 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                        title={researchMeta.refresh_remaining <= 0 ? 'Batas refresh hari ini sudah habis' : 'Refresh riset AI'}
                      >
                        <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Research Loading */}
                {researchLoading && (
                  <div className="flex flex-col items-center justify-center py-12 bg-gradient-to-br from-gray-50 to-emerald-50/30 rounded-xl border border-gray-100">
                    <div className="relative mb-4">
                      <div className="w-12 h-12 border-4 border-emerald-100 rounded-full" />
                      <div className="absolute inset-0 w-12 h-12 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">AI sedang melakukan riset...</p>
                    <p className="text-[11px] text-gray-400 mt-1">Menganalisis pasar, kompetitor, dan tren untuk produk ini</p>
                  </div>
                )}

                {/* Research Content */}
                {!researchLoading && research && (
                  <div className="space-y-3">
                    {/* Score & Verdict Bar */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`text-2xl font-black ${
                            (research.skor_potensi || 0) >= 75 ? 'text-emerald-600' :
                            (research.skor_potensi || 0) >= 50 ? 'text-amber-600' : 'text-red-500'
                          }`}>
                            {research.skor_potensi || 0}
                            <span className="text-xs font-semibold text-gray-400">/100</span>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Skor Potensi</p>
                            <p className="text-xs text-gray-600">{research.estimated_lifespan || '-'}</p>
                          </div>
                        </div>
                        <div className="max-w-[55%]">
                          <p className="text-[11px] font-medium text-emerald-800 leading-relaxed">{research.verdict || '-'}</p>
                        </div>
                      </div>
                      {/* Score bar visual */}
                      <div className="h-1.5 bg-emerald-100 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            (research.skor_potensi || 0) >= 75 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
                            (research.skor_potensi || 0) >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-gradient-to-r from-red-400 to-red-600'
                          }`}
                          style={{ width: `${Math.min(100, research.skor_potensi || 0)}%` }}
                        />
                      </div>
                    </div>

                    {/* Research Sections */}
                    {[
                      { icon: BarChart3, label: 'Analisis Pasar', content: research.analisis_pasar, color: 'text-blue-600 bg-blue-50' },
                      { icon: Users, label: 'Kompetitor', content: research.kompetitor, color: 'text-orange-600 bg-orange-50' },
                      { icon: Target, label: 'Target Market', content: research.target_market, color: 'text-pink-600 bg-pink-50' },
                      { icon: TrendingUp, label: 'Trend Forecast', content: research.trend_forecast, color: 'text-indigo-600 bg-indigo-50' },
                      { icon: Search, label: 'Rekomendasi Strategi', content: research.rekomendasi_strategi, color: 'text-emerald-600 bg-emerald-50' },
                      { icon: ShieldAlert, label: 'Risk Assessment', content: research.risk_assessment, color: 'text-red-600 bg-red-50' },
                    ].map((section) => (
                      section.content && section.content !== 'Data tidak tersedia.' && (
                        <div key={section.label} className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`p-1 rounded-md ${section.color}`}>
                              <section.icon className="w-3.5 h-3.5" />
                            </div>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500">{section.label}</p>
                          </div>
                          <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-line">{section.content}</p>
                        </div>
                      )
                    ))}

                    {/* Meta info */}
                    {researchMeta && (
                      <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-gray-50">
                        <span>
                          Pertama di-generate: {researchMeta.created_at ? new Date(researchMeta.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                        </span>
                        <span>
                          Terakhir di-refresh: {researchMeta.last_refreshed_at ? new Date(researchMeta.last_refreshed_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* No research yet & not loading */}
                {!researchLoading && !research && (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100">
                    <Microscope className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Riset belum tersedia</p>
                    <p className="text-[11px] text-gray-400 mt-1">Riset akan otomatis di-generate saat pertama kali membuka detail produk</p>
                  </div>
                )}
              </div>

              {/* Mockup / Full Appearance Link */}
              {selectedProduct.mockup_url && (
                <div className="mt-4">
                  <a 
                    href={selectedProduct.mockup_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-brand-primary transition-colors text-sm font-semibold"
                  >
                    <FileImage className="w-4 h-4" />
                    Lihat Dokumen Full Appearance (PDF/Drive)
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Fullscreen Image Viewer */}
      {showViewer && viewerImages.length > 0 && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col" onClick={() => setShowViewer(false)}>
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-3 text-white bg-black/50 backdrop-blur-sm border-b border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-sm font-medium truncate max-w-[50vw]">{viewerImages[viewerIndex]?.title}</span>
              <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded">{Math.round(viewerScale * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/50">{viewerIndex + 1} / {viewerImages.length}</span>
              <button onClick={() => setShowViewer(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Image area */}
          <div
            className="flex-1 flex items-center justify-center overflow-hidden relative cursor-grab active:cursor-grabbing"
            onClick={e => e.stopPropagation()}
            onWheel={e => {
              e.preventDefault();
              const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
              setViewerScale(s => Math.max(0.01, Math.min(20, s * factor)));
            }}
            onMouseDown={e => {
              if (e.button !== 0) return;
              setViewerDragging(true);
              setDragStart({x: e.clientX - viewerPan.x, y: e.clientY - viewerPan.y});
            }}
            onMouseMove={e => {
              if (!viewerDragging) return;
              setViewerPan({x: e.clientX - dragStart.x, y: e.clientY - dragStart.y});
            }}
            onMouseUp={() => setViewerDragging(false)}
            onMouseLeave={() => setViewerDragging(false)}
            onDoubleClick={() => {
              if (viewerScale > 1.05) { viewerResetZoom(); }
              else { setViewerScale(3); }
            }}
          >
            <img
              src={viewerImages[viewerIndex]?.url}
              alt={viewerImages[viewerIndex]?.title}
              className="select-none"
              draggable={false}
              style={{
                transform: `translate(${viewerPan.x}px, ${viewerPan.y}px) scale(${viewerScale})`,
                transformOrigin: 'center center',
                maxWidth: 'none',
                maxHeight: 'none',
                transition: viewerDragging ? 'none' : undefined,
              }}
            />

            {/* Nav arrows */}
            {viewerImages.length > 1 && (
              <>
                <button onClick={() => viewerNav(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-all shadow-lg backdrop-blur-sm">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button onClick={() => viewerNav(1)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-all shadow-lg backdrop-blur-sm">
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Bottom toolbar */}
          <div className="flex items-center justify-center gap-2 px-5 py-3 bg-black/50 backdrop-blur-sm border-t border-white/10" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewerScale(s => Math.max(0.01, s / 1.3))} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={() => setViewerScale(s => Math.min(20, s * 1.3))} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-white/20 mx-1" />
            <button onClick={viewerResetZoom} className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs font-medium transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />
              Ukuran Asli
            </button>
            <div className="w-px h-6 bg-white/20 mx-1" />
            <span className="text-white/40 text-xs hidden sm:inline">Scroll = Zoom · Drag = Geser · Klik 2x = Zoom</span>
          </div>
        </div>
      )}
    </div>
  );
}

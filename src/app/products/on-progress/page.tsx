'use client';

import { useEffect, useState } from 'react';
import { FlaskConical, Loader2, Plus, Image, Layers, Ruler, FileImage, Clock, BrainCircuit, X, ChevronRight, Edit, Trash2, CheckCircle2 } from 'lucide-react';
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

export default function OnProgressPage() {
  const [products, setProducts] = useState<OnProgressProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<OnProgressProduct | null>(null);
  const { showToast } = useToast();

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

  useEffect(() => { fetchData(); }, []);

  // Form state
  const [formData, setFormData] = useState({
    id: '', nama_produk: '', kategori: 'Kurma', fase_development: 'Ideation',
    target_rilis: '', catatan_formulasi: '', foto_produk_url: '',
    rangkaian_produk: '', ukuran_produk: '', mockup_url: '', tanggal_selesai: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload-image', { method: 'POST', body: form });
      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, foto_produk_url: data.url }));
        showToast('Gambar berhasil diupload', 'success');
      } else {
        showToast(data.error || 'Gagal upload', 'error');
      }
    } catch {
      showToast('Error upload gambar', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

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
                {/* Image header */}
                {product.foto_produk_url && (
                  <div className="h-40 bg-gray-100 relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getDirectImageUrl(product.foto_produk_url.split(',')[0].trim())}
                      alt={product.nama_produk}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
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
                <label className="form-label flex items-center gap-1.5"><Image className="w-3.5 h-3.5" /> URL Gambar Thumbnail / Galeri</label>
                <textarea 
                  className="form-input min-h-[60px] resize-y text-sm" 
                  placeholder="https://drive.google.com/..., https://imgur.com/... (Pisahkan dengan koma jika lebih dari satu gambar untuk membuat galeri)" 
                  value={formData.foto_produk_url} 
                  onChange={(e) => setFormData({ ...formData, foto_produk_url: e.target.value })} 
                />
                <p className="text-[10px] text-gray-400 mt-1">Gunakan link Google Drive, Imgur, atau link gambar publik lainnya.</p>
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
            {/* Image Gallery */}
            {selectedProduct.foto_produk_url && (
              <div className="bg-gray-100 relative rounded-t-2xl border-b border-gray-200">
                {selectedProduct.foto_produk_url.split(',').length > 1 ? (
                  <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar p-4 gap-4 h-64 items-center">
                    {selectedProduct.foto_produk_url.split(',').map((url, idx) => (
                      <div key={idx} className="flex-none w-full sm:w-80 h-56 relative rounded-xl overflow-hidden shadow-sm snap-center bg-white border border-gray-200 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getDirectImageUrl(url.trim())}
                          alt={`${selectedProduct.nama_produk} - View ${idx + 1}`}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getDirectImageUrl(selectedProduct.foto_produk_url.trim())}
                      alt={selectedProduct.nama_produk}
                      className="max-w-full max-h-full object-contain drop-shadow-md"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
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

              {/* AI Analysis */}
              {selectedProduct.ai_forecast && selectedProduct.ai_forecast !== 'Analisis tidak tersedia' && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BrainCircuit className="w-4 h-4 text-indigo-500" />
                    <p className="text-[10px] text-indigo-500 uppercase tracking-wider font-bold">AI Forecast</p>
                    {selectedProduct.ai_lifespan && (
                      <span className="text-[10px] font-semibold text-purple-600 bg-purple-100 px-2 py-0.5 rounded ml-auto">
                        Lifespan: {selectedProduct.ai_lifespan}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedProduct.ai_forecast}</p>
                </div>
              )}

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
    </div>
  );
}

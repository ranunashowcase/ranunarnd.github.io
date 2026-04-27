'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { Loader2, Sparkles, CheckCircle2, Image as ImageIcon } from 'lucide-react';

export default function MarketWatchForm() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    tipe_trend: 'Trend Produk',
    foto_url: '',
    link_medsos: '',
    nama_produk: '',
    ukuran_gramasi: '',
    harga_referensi: '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setForm(prev => ({ ...prev, foto_url: data.url }));
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      showToast('AI sedang meriset produk ini...', 'success');
      const res = await fetch('/api/products/market-watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        showToast(`"${form.nama_produk}" berhasil dianalisis AI! Buka halaman Produk Trending untuk melihat hasilnya.`, 'success');
        setForm({
          tipe_trend: 'Trend Produk', foto_url: '', link_medsos: '', nama_produk: '',
          ukuran_gramasi: '', harga_referensi: ''
        });
      } else {
        showToast(data.error || 'Gagal menganalisis/menyimpan data', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan koneksi', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-brand-accent/5 border border-brand-accent/20 p-4 rounded-xl flex gap-3 text-sm text-brand-primary mb-6">
        <Sparkles className="w-5 h-5 flex-shrink-0 text-brand-accent" />
        <p>AI akan otomatis menganalisis input kamu: <strong>referensi produk serupa, resiko, keuntungan, durasi trend,</strong> dan skor kelayakan. Cukup masukkan data dasar saja!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="form-label block mb-2">Tipe Trend <span className="text-red-500">*</span></label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="tipe_trend" value="Trend Produk" checked={form.tipe_trend === 'Trend Produk'} onChange={handleChange} className="text-brand-primary focus:ring-brand-primary" />
              <span className="text-sm font-medium text-gray-700">Trend Produk</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="tipe_trend" value="Trend Packaging Unik" checked={form.tipe_trend === 'Trend Packaging Unik'} onChange={handleChange} className="text-brand-primary focus:ring-brand-primary" />
              <span className="text-sm font-medium text-gray-700">Trend Packaging</span>
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="nama_produk" className="form-label">Nama Item / Produk <span className="text-red-500">*</span></label>
          <input
            id="nama_produk"
            name="nama_produk"
            type="text"
            required
            className="form-input"
            placeholder={form.tipe_trend === 'Trend Produk' ? "Contoh: Kurma Pouch Zaid" : "Contoh: Pouch Zipplock Transparan"}
            value={form.nama_produk}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="link_medsos" className="form-label">Link Referensi/Video (TikTok/IG) <span className="text-red-500">*</span></label>
          <input
            id="link_medsos"
            name="link_medsos"
            type="url"
            required
            className="form-input"
            placeholder="https://tiktok.com/@..."
            value={form.link_medsos}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="harga_referensi" className="form-label">Harga Referensi Pasar</label>
          <input
            id="harga_referensi"
            name="harga_referensi"
            type="text"
            className="form-input"
            placeholder="Contoh: Rp 25.000 / pcs"
            value={form.harga_referensi}
            onChange={handleChange}
          />
        </div>
      </div>

      <div>
        <label htmlFor="ukuran_gramasi" className="form-label">Ukuran / Gramasi <span className="text-red-500">*</span></label>
        <input
          id="ukuran_gramasi"
          name="ukuran_gramasi"
          type="text"
          required
          className="form-input"
          placeholder="Contoh: 250gr"
          value={form.ukuran_gramasi}
          onChange={handleChange}
        />
      </div>

      <div>
        <label className="form-label flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> File Thumbnail (.PNG/.JPG)</label>
        <div className="flex items-center gap-3">
          <input type="file" accept="image/*" className="form-input p-1.5 text-sm" onChange={handleImageUpload} disabled={uploadingImage} />
          {uploadingImage && <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />}
        </div>
        {form.foto_url && !uploadingImage && (
          <p className="text-xs text-brand-primary mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Thumbnail sukses diupload.
          </p>
        )}
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full md:w-auto">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            AI Sedang Meriset & Menganalisis...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Submit & Riset AI
          </>
        )}
      </button>
    </form>
  );
}

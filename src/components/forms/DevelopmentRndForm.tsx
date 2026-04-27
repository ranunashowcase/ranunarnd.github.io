'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { Loader2, Send, BrainCircuit } from 'lucide-react';

export default function DevelopmentRndForm() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nama_produk: '',
    kategori: 'Kurma',
    fase_development: '1. Ideation',
    target_rilis: '',
    catatan_formulasi: '',
  });

  const categories = ['Kurma', 'Kacang', 'Ekstrak', 'Trail Mix', 'Madu', 'Cokelat', 'Lainnya'];
  const phases = [
    '1. Ideation (Eksplorasi Ide)', 
    '2. Formulation (Pembuatan Sampel)', 
    '3. Lab Testing (Uji Nutrisi/Izin)', 
    '4. Packaging Design', 
    '5. Final Review & Pricing'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      showToast('Meminta AI memprediksi Lifespan Tren untuk produk ini...', 'success');
      const res = await fetch('/api/products/development', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        showToast(`Data R&D "${form.nama_produk}" berhasil diupdate & dicatat di RND DEVELOPMENT!`, 'success');
        setForm({ nama_produk: '', kategori: 'Kurma', fase_development: '1. Ideation', target_rilis: '', catatan_formulasi: '' });
      } else {
        showToast(data.error || 'Gagal menyimpan data', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan koneksi', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-brand-primary/5 border border-brand-primary/20 p-4 rounded-xl flex gap-3 text-sm text-brand-primary mb-6">
        <BrainCircuit className="w-5 h-5 flex-shrink-0 text-brand-primary" />
        <p>Catat proses uji coba produk baru di tab ini. AI akan memonitor pace / kecepatan kerjamu dibandingkan dengan siklus hidup tren (Trend Lifespan) di kategori tersebut.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="nama_produk" className="form-label">Nama Produk (Proyek) <span className="text-red-500">*</span></label>
          <input
            id="nama_produk"
            name="nama_produk"
            type="text"
            required
            className="form-input"
            placeholder="Contoh: Kurma Pistachio Cokelat"
            value={form.nama_produk}
            onChange={handleChange}
          />
        </div>

        <div>
           <label htmlFor="kategori" className="form-label">Kategori Produk <span className="text-red-500">*</span></label>
           <select id="kategori" name="kategori" required className="form-select" value={form.kategori} onChange={handleChange}>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="fase_development" className="form-label">Fase Saat Ini <span className="text-red-500">*</span></label>
          <select id="fase_development" name="fase_development" required className="form-select" value={form.fase_development} onChange={handleChange}>
            {phases.map((phase) => (
              <option key={phase} value={phase}>{phase}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="target_rilis" className="form-label">Target Tanggal Rilis <span className="text-red-500">*</span></label>
          <input
            id="target_rilis"
            name="target_rilis"
            type="date"
            required
            className="form-input"
            value={form.target_rilis}
            onChange={handleChange}
          />
        </div>
      </div>

      <div>
        <label htmlFor="catatan_formulasi" className="form-label">Catatan R&D / Hasil Sampel Terakhir</label>
        <textarea
          id="catatan_formulasi"
          name="catatan_formulasi"
          className="form-input min-h-[80px] resize-y"
          placeholder="Contoh: Manisnya kurang pas, perlu tambah ekstrak stevia 2%."
          value={form.catatan_formulasi}
          onChange={handleChange}
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full md:w-auto">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            AI Sedang Memprediksi...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Simpan Progress & Prediksi AI
          </>
        )}
      </button>
    </form>
  );
}

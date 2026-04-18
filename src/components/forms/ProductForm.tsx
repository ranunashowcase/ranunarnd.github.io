'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { Loader2, Send } from 'lucide-react';

export default function ProductForm() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    product_name: '',
    variant: '',
    status: 'development',
    category: '',
    nutrition_highlight: '',
    cogs: '',
  });

  const categories = ['Kurma', 'Kacang', 'Ekstrak', 'Trail Mix', 'Madu', 'Cokelat', 'Lainnya'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, cogs: Number(form.cogs) }),
      });

      const data = await res.json();

      if (data.success) {
        showToast(`Produk "${form.product_name}" berhasil disimpan! (${data.data.product_id})`, 'success');
        setForm({ product_name: '', variant: '', status: 'development', category: '', nutrition_highlight: '', cogs: '' });
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="product_name" className="form-label">Nama Produk <span className="text-red-500">*</span></label>
          <input
            id="product_name"
            name="product_name"
            type="text"
            required
            className="form-input"
            placeholder="Contoh: Kurma Ajwa Premium 500g"
            value={form.product_name}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="variant" className="form-label">Variant (Opsional)</label>
          <input
            id="variant"
            name="variant"
            type="text"
            className="form-input"
            placeholder="Contoh: Extra Pedas / 500g"
            value={form.variant}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="status" className="form-label">Status <span className="text-red-500">*</span></label>
          <select id="status" name="status" className="form-select" value={form.status} onChange={handleChange}>
            <option value="development">Development</option>
            <option value="live">Live</option>
          </select>
        </div>

        <div>
          <label htmlFor="category" className="form-label">Kategori <span className="text-red-500">*</span></label>
          <select id="category" name="category" required className="form-select" value={form.category} onChange={handleChange}>
            <option value="" disabled>Pilih kategori...</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="nutrition_highlight" className="form-label">Nutrition Highlight</label>
        <textarea
          id="nutrition_highlight"
          name="nutrition_highlight"
          className="form-input min-h-[80px] resize-y"
          placeholder="Contoh: Tinggi serat, rendah gula, kaya antioksidan"
          value={form.nutrition_highlight}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="cogs" className="form-label">COGS / HPP (Rp) <span className="text-red-500">*</span></label>
        <input
          id="cogs"
          name="cogs"
          type="number"
          required
          min="0"
          className="form-input"
          placeholder="Contoh: 45000"
          value={form.cogs}
          onChange={handleChange}
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full md:w-auto">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Menyimpan...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Submit Produk
          </>
        )}
      </button>
    </form>
  );
}

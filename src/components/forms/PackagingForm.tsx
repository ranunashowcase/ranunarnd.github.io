'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { Loader2, Send } from 'lucide-react';

export default function PackagingForm() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    target_product: '',
    packaging_type: '',
    material_specs: '',
    current_trend: '',
    visual_reference_url: '',
    moq: '',
    price_per_pcs: '',
    qty_per_carton: '',
    arrangement_layout: '',
  });

  const packagingTypes = ['Standing Pouch', 'Box', 'Jar', 'Sachet', 'Lainnya'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/packaging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          moq: Number(form.moq),
          price_per_pcs: Number(form.price_per_pcs),
          qty_per_carton: Number(form.qty_per_carton),
        }),
      });

      const data = await res.json();

      if (data.success) {
        showToast(`Packaging untuk "${form.target_product}" berhasil disimpan! (${data.data.packaging_id})`, 'success');
        setForm({
          target_product: '',
          packaging_type: '',
          material_specs: '',
          current_trend: '',
          visual_reference_url: '',
          moq: '',
          price_per_pcs: '',
          qty_per_carton: '',
          arrangement_layout: '',
        });
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
      {/* Section: Produk & Tipe */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="target_product" className="form-label">Target Produk <span className="text-red-500">*</span></label>
          <input
            id="target_product"
            name="target_product"
            type="text"
            required
            className="form-input"
            placeholder="Contoh: Kurma Ajwa Premium 500g"
            value={form.target_product}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="packaging_type" className="form-label">Tipe Packaging <span className="text-red-500">*</span></label>
          <select
            id="packaging_type"
            name="packaging_type"
            required
            className="form-select"
            value={form.packaging_type}
            onChange={handleChange}
          >
            <option value="" disabled>Pilih tipe...</option>
            {packagingTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Section: Material */}
      <div>
        <label htmlFor="material_specs" className="form-label">Spesifikasi Material <span className="text-red-500">*</span></label>
        <input
          id="material_specs"
          name="material_specs"
          type="text"
          required
          className="form-input"
          placeholder="Contoh: Aluminium Foil + PET 12mic"
          value={form.material_specs}
          onChange={handleChange}
        />
      </div>

      {/* Section: Trend & Visual */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="current_trend" className="form-label">Tren Desain Saat Ini</label>
          <input
            id="current_trend"
            name="current_trend"
            type="text"
            className="form-input"
            placeholder="Contoh: Minimalist, earthy tone"
            value={form.current_trend}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="visual_reference_url" className="form-label">URL Referensi Visual</label>
          <input
            id="visual_reference_url"
            name="visual_reference_url"
            type="url"
            className="form-input"
            placeholder="https://example.com/referensi.jpg"
            value={form.visual_reference_url}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Section: Pricing & Quantity */}
      <div className="bg-gray-50 rounded-xl p-5 space-y-4">
        <p className="text-sm font-semibold text-gray-700 mb-1">💰 Informasi Harga & Kuantitas</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label htmlFor="moq" className="form-label">MOQ (Minimum Order) <span className="text-red-500">*</span></label>
            <input
              id="moq"
              name="moq"
              type="number"
              required
              min="0"
              className="form-input"
              placeholder="Contoh: 1000"
              value={form.moq}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="price_per_pcs" className="form-label">Harga per Pcs (Rp) <span className="text-red-500">*</span></label>
            <input
              id="price_per_pcs"
              name="price_per_pcs"
              type="number"
              required
              min="0"
              className="form-input"
              placeholder="Contoh: 2500"
              value={form.price_per_pcs}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="qty_per_carton" className="form-label">Qty per Karton <span className="text-red-500">*</span></label>
            <input
              id="qty_per_carton"
              name="qty_per_carton"
              type="number"
              required
              min="0"
              className="form-input"
              placeholder="Contoh: 50"
              value={form.qty_per_carton}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="arrangement_layout" className="form-label">Arrangement Layout</label>
        <input
          id="arrangement_layout"
          name="arrangement_layout"
          type="text"
          className="form-input"
          placeholder="Contoh: 5 x 10 pcs per karton"
          value={form.arrangement_layout}
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
            Submit Packaging
          </>
        )}
      </button>
    </form>
  );
}

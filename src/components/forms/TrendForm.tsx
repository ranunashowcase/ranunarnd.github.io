'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { Loader2, Send } from 'lucide-react';

export default function TrendForm() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    trend_name: '',
    target_market: '',
    competitor_price: '',
    trend_status: 'stabil',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, competitor_price: Number(form.competitor_price) }),
      });

      const data = await res.json();

      if (data.success) {
        showToast(`Tren "${form.trend_name}" berhasil disimpan! (${data.data.trend_id})`, 'success');
        setForm({ trend_name: '', target_market: '', competitor_price: '', trend_status: 'stabil' });
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
      <div>
        <label htmlFor="trend_name" className="form-label">Nama Tren <span className="text-red-500">*</span></label>
        <input
          id="trend_name"
          name="trend_name"
          type="text"
          required
          className="form-input"
          placeholder="Contoh: Kurma Madu Sachet"
          value={form.trend_name}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="target_market" className="form-label">Target Market <span className="text-red-500">*</span></label>
        <textarea
          id="target_market"
          name="target_market"
          required
          className="form-input min-h-[80px] resize-y"
          placeholder="Contoh: Ibu rumah tangga usia 25-40 tahun, urban, menengah atas"
          value={form.target_market}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="competitor_price" className="form-label">Harga Kompetitor (Rp) <span className="text-red-500">*</span></label>
          <input
            id="competitor_price"
            name="competitor_price"
            type="number"
            required
            min="0"
            className="form-input"
            placeholder="Contoh: 35000"
            value={form.competitor_price}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="trend_status" className="form-label">Status Tren <span className="text-red-500">*</span></label>
          <select id="trend_status" name="trend_status" className="form-select" value={form.trend_status} onChange={handleChange}>
            <option value="naik">📈 Naik</option>
            <option value="turun">📉 Turun</option>
            <option value="stabil">➡️ Stabil</option>
          </select>
        </div>
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
            Submit Tren
          </>
        )}
      </button>
    </form>
  );
}

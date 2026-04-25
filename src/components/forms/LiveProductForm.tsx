'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { Loader2, Send } from 'lucide-react';

export default function LiveProductForm() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    barcode_produk: '',
    sku_produk: '',
    sku_per_produk: '',
    nama_barang: '',
    qty: '1',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/products/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        showToast(`Produk "${form.nama_barang}" berhasil ditambahkan ke MASTER SKU!`, 'success');
        setForm({ barcode_produk: '', sku_produk: '', sku_per_produk: '', nama_barang: '', qty: '1' });
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
          <label htmlFor="barcode_produk" className="form-label">Barcode Produk <span className="text-red-500">*</span></label>
          <input
            id="barcode_produk"
            name="barcode_produk"
            type="text"
            required
            className="form-input"
            placeholder="Contoh: 8994462130080"
            value={form.barcode_produk}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="sku_produk" className="form-label">SKU Produk <span className="text-red-500">*</span></label>
          <input
            id="sku_produk"
            name="sku_produk"
            type="text"
            required
            className="form-input"
            placeholder="Contoh: SUK1KG"
            value={form.sku_produk}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="sku_per_produk" className="form-label">SKU Per Produk</label>
          <input
            id="sku_per_produk"
            name="sku_per_produk"
            type="text"
            className="form-input"
            placeholder="Contoh: SUK1KG"
            value={form.sku_per_produk}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="qty" className="form-label">Qty (Jumlah Pack per SKU) <span className="text-red-500">*</span></label>
          <input
            id="qty"
            name="qty"
            type="number"
            required
            min="1"
            className="form-input"
            placeholder="Contoh: 1 (atau 28 untuk karton)"
            value={form.qty}
            onChange={handleChange}
          />
        </div>
      </div>

      <div>
        <label htmlFor="nama_barang" className="form-label">Nama Barang <span className="text-red-500">*</span></label>
        <input
          id="nama_barang"
          name="nama_barang"
          type="text"
          required
          className="form-input"
          placeholder="Contoh: Ranuna - Kurma Sukari 1 Kg"
          value={form.nama_barang}
          onChange={handleChange}
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full md:w-auto">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Menyimpan ke MASTER SKU...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Submit Live Produk
          </>
        )}
      </button>
    </form>
  );
}

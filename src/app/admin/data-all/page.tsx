'use client';

import { useState, useEffect } from 'react';
import { Database, Trash2, Calendar, AlertTriangle, CheckCircle2, ShoppingCart, Package, FlaskConical, TrendingUp, BrainCircuit } from 'lucide-react';

interface DataCounts {
  sales: number;
  sku: number;
  rnd: number;
  market: number;
  info: number;
}

export default function DataAllPage() {
  const [counts, setCounts] = useState<DataCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>('');
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string>('all');
  const [deleteDate, setDeleteDate] = useState<string>('');
  const [confirmText, setConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchData = async (date: string) => {
    setLoading(true);
    try {
      const query = date ? `?date=${date}` : '';
      const res = await fetch(`/api/data-all${query}`);
      const json = await res.json();
      if (json.success) {
        setCounts(json.data.counts);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(dateFilter);
  }, [dateFilter]);

  const handleDelete = async () => {
    if (confirmText !== 'HAPUS') return;
    setDeleteLoading(true);
    setDeleteResult(null);

    try {
      const query = new URLSearchParams();
      query.set('target', deleteTarget);
      if (deleteDate) query.set('date', deleteDate);

      const res = await fetch(`/api/data-all?${query.toString()}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      
      setDeleteResult({
        success: json.success,
        message: json.success ? json.message : (json.error || 'Gagal menghapus data')
      });

      if (json.success) {
        // Refresh data after successful delete
        fetchData(dateFilter);
        setConfirmText(''); // reset
        setTimeout(() => {
          setIsDeleteModalOpen(false);
          setDeleteResult(null);
        }, 3000);
      }
    } catch (error) {
      setDeleteResult({ success: false, message: 'Terjadi kesalahan jaringan.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const cards = [
    { id: 'sales', title: 'Data Penjualan', count: counts?.sales || 0, icon: ShoppingCart, color: 'bg-blue-500', bg: 'bg-blue-50' },
    { id: 'sku', title: 'Master SKU', count: counts?.sku || 0, icon: Package, color: 'bg-emerald-500', bg: 'bg-emerald-50' },
    { id: 'rnd', title: 'Produk On Progress', count: counts?.rnd || 0, icon: FlaskConical, color: 'bg-violet-500', bg: 'bg-violet-50' },
    { id: 'market', title: 'Market Watch', count: counts?.market || 0, icon: TrendingUp, color: 'bg-amber-500', bg: 'bg-amber-50' },
    { id: 'info', title: 'Input Informasi', count: counts?.info || 0, icon: BrainCircuit, color: 'bg-pink-500', bg: 'bg-pink-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-brand-primary" />
            Data Keseluruhan (Master)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Visualisasi dan manajemen semua data dari Google Sheets.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              className="form-input pl-9 text-sm w-full"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          {dateFilter && (
            <button 
              onClick={() => setDateFilter('')}
              className="text-xs text-gray-500 hover:text-gray-900 underline whitespace-nowrap"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 text-${card.color.replace('bg-', '')}`} />
              </div>
              <p className="text-sm font-medium text-gray-500">{card.title}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? <span className="animate-pulse bg-gray-200 h-8 w-16 rounded block" /> : card.count}
              </h3>
            </div>
          );
        })}
      </div>

      <div className="bg-red-50 border border-red-100 rounded-2xl p-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Zona Berbahaya (Danger Zone)
          </h3>
          <p className="text-sm text-red-700/80 mt-1 max-w-xl">
            Fitur ini akan menghapus data secara permanen dari Google Sheets. Data yang terhapus tidak dapat dikembalikan. Gunakan dengan sangat hati-hati.
          </p>
        </div>
        <button 
          onClick={() => setIsDeleteModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg shadow-red-600/20 transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <Trash2 className="w-4 h-4" />
          Hapus Data
        </button>
      </div>

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-gray-100 bg-red-50/50">
              <h2 className="text-xl font-bold text-red-900 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                Hapus Data Permanen
              </h2>
              <p className="text-sm text-red-700/70 mt-1">Pilih target data dan rentang waktu yang ingin dihapus.</p>
            </div>

            {deleteResult?.success ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-lg font-bold text-gray-900">Penghapusan Berhasil</p>
                <p className="text-sm text-gray-500 mt-1">{deleteResult.message}</p>
              </div>
            ) : (
              <div className="p-6 space-y-5">
                {deleteResult && !deleteResult.success && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100">
                    {deleteResult.message}
                  </div>
                )}

                <div>
                  <label className="form-label">Target Data</label>
                  <select 
                    className="form-select"
                    value={deleteTarget}
                    onChange={(e) => setDeleteTarget(e.target.value)}
                  >
                    <option value="all">Semua Sheet (Kecuali Master SKU)</option>
                    <option value="sales">Data Penjualan (Pemesanan Produk)</option>
                    <option value="rnd">Produk On Progress (R&D)</option>
                    <option value="market">Market Watch (Trend Manual)</option>
                    <option value="info">Input Informasi</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Berdasarkan Tanggal (Opsional)</label>
                  <input 
                    type="date"
                    className="form-input"
                    value={deleteDate}
                    onChange={(e) => setDeleteDate(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Kosongkan jika ingin menghapus <b>seluruh data</b> pada target di atas.</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <label className="form-label text-red-600 font-semibold mb-2">Konfirmasi Keamanan</label>
                  <p className="text-xs text-gray-600 mb-3">Ketik kata <strong className="text-red-600">HAPUS</strong> di bawah ini untuk melanjutkan.</p>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="Ketik HAPUS"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => { setIsDeleteModalOpen(false); setConfirmText(''); }}
                    className="btn-ghost flex-1"
                    disabled={deleteLoading}
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleDelete}
                    disabled={confirmText !== 'HAPUS' || deleteLoading}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-xl shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex-1 flex justify-center items-center gap-2 transition-all"
                  >
                    {deleteLoading ? (
                      <span className="animate-pulse">Menghapus...</span>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Ya, Hapus Data
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

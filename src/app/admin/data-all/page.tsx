'use client';

import { useState, useEffect } from 'react';
import { Database, Trash2, Calendar, AlertTriangle, CheckCircle2, ShoppingCart, Package, FlaskConical, TrendingUp, BrainCircuit } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DataCounts {
  sales: number;
  sku: number;
  rnd: number;
  market: number;
  info: number;
}

interface DataDetails {
  sales: any[];
  sku: any[];
  rnd: any[];
  market: any[];
  info: any[];
}

export default function DataAllPage() {
  const [counts, setCounts] = useState<DataCounts | null>(null);
  const [details, setDetails] = useState<DataDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>('');
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string>('all');
  const [deleteDate, setDeleteDate] = useState<string>('');
  const [confirmText, setConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [activeTab, setActiveTab] = useState<'sales' | 'sku' | 'rnd' | 'market' | 'info'>('sales');

  const fetchData = async (date: string) => {
    setLoading(true);
    try {
      const query = date ? `?date=${date}` : '';
      const res = await fetch(`/api/data-all${query}`);
      const json = await res.json();
      if (json.success) {
        setCounts(json.data.counts);
        setDetails(json.data.details);
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
    { id: 'sales', title: 'Data Penjualan', count: counts?.sales || 0, icon: ShoppingCart, color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-600' },
    { id: 'sku', title: 'Master SKU', count: counts?.sku || 0, icon: Package, color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { id: 'rnd', title: 'Produk On Progress', count: counts?.rnd || 0, icon: FlaskConical, color: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-600' },
    { id: 'market', title: 'Market Watch', count: counts?.market || 0, icon: TrendingUp, color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-600' },
    { id: 'info', title: 'Input Informasi', count: counts?.info || 0, icon: BrainCircuit, color: 'bg-pink-500', bg: 'bg-pink-50', text: 'text-pink-600' },
  ];

  const chartData = [
    { name: 'Penjualan', Total: counts?.sales || 0 },
    { name: 'Master SKU', Total: counts?.sku || 0 },
    { name: 'On Progress', Total: counts?.rnd || 0 },
    { name: 'Market Watch', Total: counts?.market || 0 },
    { name: 'Informasi', Total: counts?.info || 0 },
  ];

  // Dynamic headers: extract from actual data keys
  const getTableHeaders = (type: keyof DataDetails): string[] => {
    if (!details || !details[type] || details[type].length === 0) {
      // Fallback headers when no data
      const fallbackHeaders: Record<string, string[]> = {
        sales: ['tanggal', 'nama_barang', 'qty', 'barcode_produk', 'sku_produk'],
        sku: ['nama_barang', 'sku_produk', 'barcode_produk'],
        rnd: ['nama_produk', 'kategori', 'fase_development', 'target_rilis', 'timestamp'],
        market: ['Timestamp', 'Nama Ide/Produk', 'Tipe Trend', 'AI Layak Skor (1-100)', 'AI Estimasi Durasi Trend'],
        info: ['created_at', 'kategori_info', 'judul', 'sumber'],
      };
      return fallbackHeaders[type] || [];
    }
    // Get keys from first data row, filter out very long/internal ones
    const allKeys = Object.keys(details[type][0]);
    return allKeys.filter(k => k.length < 50);
  };

  const renderTableRows = (type: keyof DataDetails, data: any[]) => {
    const headers = getTableHeaders(type);
    if (!data || data.length === 0) {
      return (
        <tr>
          <td colSpan={headers.length || 5} className="px-4 py-8 text-center text-gray-500">
            Tidak ada data yang ditemukan.
          </td>
        </tr>
      );
    }

    // Only show top 50 to avoid performance issues
    return data.slice(0, 50).map((row, i) => (
      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
        {headers.map(header => {
          const value = row[header];
          const displayValue = value !== undefined && value !== null && value !== '' ? String(value) : '-';
          // Truncate very long values
          const truncated = displayValue.length > 120 ? displayValue.substring(0, 120) + '…' : displayValue;
          return (
            <td key={header} className="px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap min-w-[120px] max-w-sm align-top" title={displayValue}>
              {truncated}
            </td>
          );
        })}
      </tr>
    ));
  };

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
            <div key={card.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-2">
                <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.text}`} />
                </div>
              </div>
              <p className="text-xs font-medium text-gray-500">{card.title}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? <span className="animate-pulse bg-gray-200 h-8 w-16 rounded block" /> : card.count}
              </h3>
            </div>
          );
        })}
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Grafik Volume Data</h3>
        <div className="h-[300px] w-full">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="Total" fill="#2d6a4f" radius={[6, 6, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tables Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Detail Data</h3>
          <div className="flex flex-wrap gap-2">
            {cards.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveTab(c.id as any)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === c.id ? `bg-white shadow-sm border border-gray-200 ${c.text}` : 'text-gray-500 hover:bg-white hover:text-gray-700'}`}
              >
                {c.title}
              </button>
            ))}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {getTableHeaders(activeTab).map(header => (
                  <th key={header} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {header.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={getTableHeaders(activeTab).length || 5} className="px-4 py-8 text-center">
                    <div className="flex justify-center">
                       <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary"></div>
                    </div>
                  </td>
                </tr>
              ) : (
                renderTableRows(activeTab, details ? details[activeTab] : [])
              )}
            </tbody>
          </table>
          {!loading && details && details[activeTab] && details[activeTab].length > 50 && (
            <div className="px-4 py-3 text-center text-xs text-gray-500 border-t border-gray-100 bg-gray-50">
              Menampilkan 50 data teratas. (Total: {details[activeTab].length} data)
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
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

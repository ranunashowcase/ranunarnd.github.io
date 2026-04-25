'use client';

import { useEffect, useState } from 'react';
import { Package, Loader2, Search, Filter, TrendingUp, Calendar, BrainCircuit } from 'lucide-react';

interface ProductSales {
  nama_barang: string;
  sku_produk: string;
  barcode_produk: string;
  total_qty: number;
  image_url?: string;
  daily_data: { tanggal: string; qty: number }[];
}

export default function ProductsAllPage() {
  const [products, setProducts] = useState<ProductSales[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'qty' | 'name'>('qty');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetch('/api/sales-data')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setProducts(json.data || []);
          generateAnalysis(json.data || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const generateAnalysis = async (data: ProductSales[]) => {
    if (data.length === 0) return;
    setAnalyzing(true);
    try {
      const res = await fetch('/api/ai/sales-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: data }),
      });
      const result = await res.json();
      if (result.success) setAiAnalysis(result.analisis);
    } catch {
      // Ignored
    } finally {
      setAnalyzing(false);
    }
  };

  const activeProducts = products.map(p => {
    if (!startDate && !endDate) return p;
    let filteredDaily = p.daily_data;
    if (startDate) {
      filteredDaily = filteredDaily.filter(d => d.tanggal >= startDate);
    }
    if (endDate) {
      filteredDaily = filteredDaily.filter(d => d.tanggal <= endDate);
    }
    return {
      ...p,
      total_qty: startDate || endDate ? filteredDaily.reduce((acc, curr) => acc + curr.qty, 0) : p.total_qty,
      daily_data: filteredDaily,
    };
  });

  const filtered = activeProducts
    .filter((p) => p.nama_barang.toLowerCase().includes(search.toLowerCase()) || p.sku_produk.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === 'qty' ? b.total_qty - a.total_qty : a.nama_barang.localeCompare(b.nama_barang));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produk All</h1>
          <p className="text-sm text-gray-400 mt-1">
            Data seluruh produk live & penjualan — {activeProducts.length} produk
          </p>
        </div>
      </div>

      {/* AI Intelligence Card */}
      {!loading && products.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-950 via-violet-950 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 backdrop-blur-sm border border-white/10">
            <BrainCircuit className="w-6 h-6 text-indigo-300" />
          </div>
          <div className="flex-1 w-full">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-violet-300">
                AI Sales Intelligence
              </span>
            </h2>
            {analyzing ? (
              <div className="flex items-center gap-2 text-indigo-200/70 py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> AI sedang mengunyah data...
              </div>
            ) : aiAnalysis ? (
              <p className="text-sm text-indigo-100/80 leading-relaxed font-light mt-2 whitespace-pre-wrap">
                {aiAnalysis}
              </p>
            ) : (
              <p className="text-sm text-indigo-400">Analisis tidak tersedia saat ini.</p>
            )}
            <div className="mt-4 flex gap-2">
               <button 
                 onClick={() => generateAnalysis(activeProducts)} 
                 className="text-xs bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-lg text-indigo-200 border border-white/5 flex items-center gap-1"
               >
                 <BrainCircuit className="w-3 h-3" /> Analisis Ulang Sesuai Filter
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari produk atau SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-10"
          />
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-1">
             <input 
               type="date" 
               value={startDate} 
               onChange={(e) => setStartDate(e.target.value)}
               className="text-sm border-none bg-transparent outline-none p-1.5 text-gray-700" 
             />
             <span className="text-gray-400 text-xs">-</span>
             <input 
               type="date" 
               value={endDate} 
               onChange={(e) => setEndDate(e.target.value)}
               className="text-sm border-none bg-transparent outline-none p-1.5 text-gray-700" 
             />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'qty' | 'name')}
            className="form-select w-auto"
          >
            <option value="qty">Terlaris</option>
            <option value="name">Nama A-Z</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Package className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-1">Belum Ada Data Produk</h3>
          <p className="text-sm text-gray-400">Data akan muncul setelah ada penjualan di PEMESANAN PRODUK</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((product, index) => {
            const dailyData = product.daily_data.slice(-14);
            const maxDay = Math.max(...dailyData.map((d) => d.qty), 1);
            const isGrowing = dailyData.length >= 2 && dailyData[dailyData.length - 1].qty > dailyData[0].qty;

            return (
              <div key={product.sku_produk + '-' + (product.barcode_produk || '') + '-' + index} className="bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden group">
                {/* Header */}
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    {/* Image */}
                    <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                      {product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image_url}
                          alt={product.nama_barang}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 truncate">{product.nama_barang}</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">SKU: {product.sku_produk}</p>
                      <p className="text-[10px] text-gray-400">Barcode: {product.barcode_produk}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Total Terjual</p>
                      <p className="text-xl font-bold text-gray-900">{product.total_qty} <span className="text-xs font-normal text-gray-400">pcs</span></p>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg ${
                      isGrowing ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'
                    }`}>
                      <TrendingUp className={`w-3 h-3 ${!isGrowing ? 'rotate-180' : ''}`} />
                      {isGrowing ? 'Naik' : 'Stabil'}
                    </div>
                  </div>

                  {/* Mini chart */}
                  {dailyData.length > 0 && (
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1.5 flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        Penjualan 14 hari terakhir
                      </p>
                      <div className="flex items-end gap-[3px] h-10 bg-gray-50 rounded-lg p-1.5">
                        {dailyData.map((day, i) => {
                          const h = Math.max((day.qty / maxDay) * 28, 2);
                          return (
                            <div
                              key={i}
                              className={`flex-1 rounded-sm bg-gradient-to-t transition-all duration-300 ${
                                isGrowing ? 'from-emerald-400 to-emerald-600' : 'from-amber-400 to-amber-500'
                              }`}
                              style={{ height: `${h}px` }}
                              title={`${day.tanggal}: ${day.qty} pcs`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, useRef } from 'react';
import { FileText, Printer, Download, Loader2, Package, TrendingUp, FlaskConical, Sparkles, Calendar, BarChart3 } from 'lucide-react';

interface ReportData {
  salesProducts: any[];
  onProgress: any[];
  aiTrends: any;
  trendingMaster: any[];
}

export default function ReportPage() {
  const [data, setData] = useState<ReportData>({
    salesProducts: [],
    onProgress: [],
    aiTrends: null,
    trendingMaster: [],
  });
  const [loading, setLoading] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/sales-data').then((r) => r.json()).catch(() => ({ data: [] })),
      fetch('/api/products/on-progress').then((r) => r.json()).catch(() => ({ data: [] })),
      fetch('/api/ai/trends-today').then((r) => r.json()).catch(() => ({ data: null })),
      fetch('/api/trending-master').then((r) => r.json()).catch(() => ({ data: [] })),
    ]).then(([sales, onProgress, trends, master]) => {
      setData({
        salesProducts: sales.data || [],
        onProgress: onProgress.data || [],
        aiTrends: trends.data || null,
        trendingMaster: master.data || [],
      });
      setLoading(false);
    });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handlePDF = () => {
    // Browser print dialog with "Save as PDF" option
    window.print();
  };

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-10 h-10 text-brand-primary animate-spin mb-4" />
        <p className="text-sm text-gray-400">Menyiapkan report...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls (hidden in print) */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report</h1>
          <p className="text-sm text-gray-400 mt-1">Presentasi lengkap R&D Intelligence</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="btn-ghost">
            <Printer className="w-4 h-4" /> Cetak
          </button>
          <button onClick={handlePDF} className="btn-primary">
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="report-content space-y-8">

        {/* Cover / Header Section */}
        <section className="bg-gradient-to-br from-[#0f2419] via-[#1B4332] to-[#2D6A4F] text-white rounded-2xl print:rounded-none p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-accent/10 rounded-full translate-y-24 -translate-x-12 blur-2xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-brand-accent/20 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-brand-accent" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">R&D Intelligence Report</h1>
                <p className="text-sm text-white/50">PT. Shalee Berkah Jaya</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Calendar className="w-4 h-4" />
              {today}
            </div>
          </div>
        </section>

        {/* Summary Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 print:shadow-none print:border-gray-300">
            <Package className="w-5 h-5 text-emerald-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{data.salesProducts.length}</p>
            <p className="text-xs text-gray-400">Produk Live</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 print:shadow-none print:border-gray-300">
            <FlaskConical className="w-5 h-5 text-purple-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{data.onProgress.length}</p>
            <p className="text-xs text-gray-400">Produk R&D</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 print:shadow-none print:border-gray-300">
            <TrendingUp className="w-5 h-5 text-amber-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{data.trendingMaster.length}</p>
            <p className="text-xs text-gray-400">Trending Tercatat</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 print:shadow-none print:border-gray-300">
            <Sparkles className="w-5 h-5 text-indigo-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{data.aiTrends?.products?.length || 0}</p>
            <p className="text-xs text-gray-400">AI Trend Insight</p>
          </div>
        </section>

        {/* Section: Produk Live */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden print:shadow-none print:border-gray-300">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white print:bg-white">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              Produk Live — Data Penjualan
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Produk</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Barcode</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total Terjual</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider print:hidden">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.salesProducts.slice(0, 20).map((product: any, i: number) => {
                  const daily = product.daily_data || [];
                  const isGrowing = daily.length >= 2 && daily[daily.length - 1]?.qty > daily[0]?.qty;
                  return (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="px-6 py-3 text-gray-400 font-medium">{i + 1}</td>
                      <td className="px-6 py-3 font-semibold text-gray-900">{product.nama_barang}</td>
                      <td className="px-6 py-3 text-gray-500 font-mono text-xs">{product.sku_produk}</td>
                      <td className="px-6 py-3 text-gray-500 font-mono text-xs">{product.barcode_produk}</td>
                      <td className="px-6 py-3 text-right font-bold text-gray-900">{product.total_qty} pcs</td>
                      <td className="px-6 py-3 print:hidden">
                        <div className="flex items-end gap-[2px] h-5">
                          {daily.slice(-10).map((d: any, j: number) => {
                            const maxD = Math.max(...daily.slice(-10).map((x: any) => x.qty), 1);
                            const h = Math.max((d.qty / maxD) * 20, 2);
                            return (
                              <div
                                key={j}
                                className={`w-1.5 rounded-full ${isGrowing ? 'bg-emerald-400' : 'bg-amber-400'}`}
                                style={{ height: `${h}px` }}
                              />
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section: Produk On Progress */}
        {data.onProgress.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden print:shadow-none print:border-gray-300 print:break-before-page">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white print:bg-white">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-purple-600" />
                Produk On Progress — R&D Tracker
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.onProgress.map((product: any, i: number) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{product.nama_produk}</h4>
                      <p className="text-xs text-gray-400">{product.kategori}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg">
                      {product.fase_development}
                    </span>
                  </div>
                  {product.target_rilis && (
                    <p className="text-xs text-gray-500 mb-1">🎯 Target: {product.target_rilis}</p>
                  )}
                  {product.ukuran_produk && (
                    <p className="text-xs text-gray-500 mb-1">📏 Ukuran: {product.ukuran_produk}</p>
                  )}
                  {product.ai_lifespan && product.ai_lifespan !== 'Tidak diketahui' && (
                    <p className="text-xs text-indigo-600 mt-2">⏱ AI Lifespan: {product.ai_lifespan}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section: Market Trends */}
        {data.aiTrends && data.aiTrends.products && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden print:shadow-none print:border-gray-300 print:break-before-page">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white print:bg-white">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Market Trend Intelligence
              </h2>
            </div>

            {data.aiTrends.insight_utama && (
              <div className="px-6 pt-5">
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                  <p className="text-sm text-indigo-800 italic">&quot;{data.aiTrends.insight_utama}&quot;</p>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Produk</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Marketplace</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Skor</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Durasi</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rekomendasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.aiTrends.products.map((product: any, i: number) => (
                    <tr key={i}>
                      <td className="px-6 py-3 text-gray-400 font-medium">{i + 1}</td>
                      <td className="px-6 py-3">
                        <p className="font-semibold text-gray-900">{product.nama_produk}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{product.alasan_trending}</p>
                      </td>
                      <td className="px-6 py-3 text-gray-500 text-xs">{product.marketplace}</td>
                      <td className="px-6 py-3 font-bold text-indigo-600">{product.skor_trend}</td>
                      <td className="px-6 py-3 text-xs text-gray-600">{product.estimasi_durasi}</td>
                      <td className="px-6 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          product.rekomendasi?.toLowerCase().includes('worth') ? 'bg-emerald-50 text-emerald-600' :
                          product.rekomendasi?.toLowerCase().includes('risk') ? 'bg-red-50 text-red-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {product.rekomendasi}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.aiTrends.rekomendasi_bisnis && (
              <div className="px-6 pb-5 pt-3">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-1">Rekomendasi Bisnis</p>
                  <p className="text-sm text-emerald-800">{data.aiTrends.rekomendasi_bisnis}</p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Trending Master */}
        {data.trendingMaster.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden print:shadow-none print:border-gray-300">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white print:bg-white">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                Trending Master — Data Upload
              </h2>
            </div>
            <div className="p-6 space-y-3">
              {data.trendingMaster.map((item: any, i: number) => {
                const score = Number(item.trend_score) || 50;
                return (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-400 w-6">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.product_name}</p>
                        <span className="text-xs font-bold text-brand-primary ml-2">{score}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600" style={{ width: `${score}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Footer */}
        <section className="text-center py-6 border-t border-gray-100 text-xs text-gray-400 print:border-gray-300">
          <p>R&D Intelligence Report — PT. Shalee Berkah Jaya</p>
          <p className="mt-1">Generated: {today} | Powered by SBJ R&D Intelligence System</p>
        </section>
      </div>
    </div>
  );
}

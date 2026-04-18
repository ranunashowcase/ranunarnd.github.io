'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Sparkles, Loader2, RefreshCw, Clock, Target, ShoppingBag, Star, AlertTriangle, ThumbsUp } from 'lucide-react';
import { AiTrendAnalysis } from '@/types';

interface TrendMasterData {
  product_category: string;
  product_name: string;
  product_image_url: string;
  estimated_duration: string | number;
  trend_score: number;
}

export default function TrendsTodayPage() {
  const [aiData, setAiData] = useState<AiTrendAnalysis | null>(null);
  const [masterData, setMasterData] = useState<TrendMasterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMaster, setLoadingMaster] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    setLoadingMaster(true);

    // Fetch AI trends
    fetch('/api/ai/trends-today')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) setAiData(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch trending master
    fetch('/api/trending-master')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setMasterData(json.data || []);
      })
      .catch(() => {})
      .finally(() => setLoadingMaster(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const sortedMaster = [...masterData].sort((a, b) => (Number(b.trend_score) || 0) - (Number(a.trend_score) || 0));
  const maxScore = Math.max(...sortedMaster.map((d) => Number(d.trend_score) || 0), 100);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trend Hari Ini</h1>
          <p className="text-sm text-gray-400 mt-1">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {' '} — Powered by AI
          </p>
        </div>
        <button onClick={fetchAll} className="btn-ghost">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* AI Deep Analysis */}
      <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 rounded-2xl shadow-xl text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full -translate-y-40 translate-x-40 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-indigo-500/10 rounded-full translate-y-30 -translate-x-20 blur-3xl" />

        <div className="p-8 relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-white/10 rounded-xl">
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Deep Market Analysis</h2>
              <p className="text-xs text-white/40">Analisis lengkap produk natural & healthy trending di marketplace & sosial media</p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-12">
              <Loader2 className="w-10 h-10 text-purple-400 animate-spin mb-3" />
              <p className="text-sm text-white/40 animate-pulse">AI sedang menganalisa seluruh pasar...</p>
            </div>
          ) : aiData ? (
            <div className="space-y-6">
              {/* Key insight */}
              <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                <p className="text-white/80 leading-relaxed italic">&quot;{aiData.insight_utama}&quot;</p>
              </div>

              {/* Product cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiData.products?.map((product, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/8 transition-all duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-2.5">
                        <div className="w-9 h-9 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="w-4 h-4 text-purple-300" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{product.nama_produk}</h4>
                          <p className="text-[10px] text-white/30">{product.marketplace}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-1 rounded-lg">
                        {product.skor_trend}
                      </span>
                    </div>

                    <p className="text-xs text-white/50 leading-relaxed mb-4">{product.alasan_trending}</p>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[11px]">
                        <Clock className="w-3 h-3 text-white/30" />
                        <span className="text-white/50">Estimasi: </span>
                        <span className="text-white/80 font-medium">{product.estimasi_durasi}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <Target className="w-3 h-3 text-white/30" />
                        <span className="text-white/50">Rekomendasi: </span>
                        <span className={`font-semibold ${
                          product.rekomendasi.toLowerCase().includes('worth') ? 'text-emerald-400' :
                          product.rekomendasi.toLowerCase().includes('risk') ? 'text-red-400' : 'text-amber-400'
                        }`}>
                          {product.rekomendasi}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Business recommendation */}
              {aiData.rekomendasi_bisnis && (
                <div className="bg-gradient-to-r from-emerald-900/30 to-emerald-800/20 border border-emerald-500/20 p-5 rounded-xl">
                  <div className="flex items-start gap-3">
                    <ThumbsUp className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-emerald-300/60 uppercase tracking-wider font-bold mb-1">Rekomendasi Aksi Bisnis</p>
                      <p className="text-sm text-white/80 leading-relaxed">{aiData.rekomendasi_bisnis}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
              <p className="text-sm text-white/60">AI tidak tersedia saat ini</p>
            </div>
          )}
        </div>
      </section>

      {/* Trending Master Data (Bar Graph) */}
      <section className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-primary/10">
              <TrendingUp className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Trending Products Score</h2>
              <p className="text-sm text-gray-400">Data dari upload Master Tren</p>
            </div>
          </div>
        </div>

        {loadingMaster ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
          </div>
        ) : sortedMaster.length === 0 ? (
          <div className="p-12 text-center">
            <TrendingUp className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Belum ada data trending master</p>
            <p className="text-xs text-gray-300 mt-1">Upload Excel di menu Input Informasi</p>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {sortedMaster.map((item, index) => {
              const score = Number(item.trend_score) || 50;
              const percentage = (score / maxScore) * 100;
              const colors = [
                'from-brand-primary to-brand-primary-light',
                'from-emerald-500 to-teal-500',
                'from-teal-500 to-cyan-500',
                'from-cyan-500 to-sky-500',
                'from-sky-500 to-blue-500',
                'from-blue-500 to-indigo-500',
                'from-indigo-500 to-violet-500',
              ];

              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                    {item.product_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.product_image_url} alt={item.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-[8px]">No IMG</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-[10px] font-semibold text-brand-primary uppercase tracking-wider">
                          {item.product_category}
                        </span>
                        <h4 className="text-sm font-bold text-gray-900 truncate">{item.product_name}</h4>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <div className="flex items-center gap-1 text-xs font-bold text-brand-primary">
                          <Star className="w-3 h-3" />
                          {score}
                        </div>
                        <p className="text-[10px] text-gray-400">{item.estimated_duration}</p>
                      </div>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${colors[index % colors.length]} transition-all duration-1000`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Prediction & Recommendation Cards */}
      {aiData && aiData.products && aiData.products.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Duration Predictions */}
          <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2 rounded-xl bg-amber-50">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Prediksi Durasi Tren</h3>
            </div>
            <div className="space-y-3">
              {aiData.products.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700 truncate flex-1">{p.nama_produk}</span>
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg ml-3 flex-shrink-0">
                    {p.estimasi_durasi}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Worth it? Analysis */}
          <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2 rounded-xl bg-emerald-50">
                <Target className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Layak Ikut Jualan?</h3>
            </div>
            <div className="space-y-3">
              {aiData.products.map((p, i) => {
                const isWorth = p.rekomendasi.toLowerCase().includes('worth') || p.rekomendasi.toLowerCase().includes('bagus');
                const isRisky = p.rekomendasi.toLowerCase().includes('risk') || p.rekomendasi.toLowerCase().includes('saturated');
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-700 truncate flex-1">{p.nama_produk}</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ml-3 flex-shrink-0 ${
                      isWorth ? 'text-emerald-600 bg-emerald-50' :
                      isRisky ? 'text-red-600 bg-red-50' :
                      'text-amber-600 bg-amber-50'
                    }`}>
                      {p.rekomendasi}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

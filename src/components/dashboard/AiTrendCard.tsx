'use client';

import { useEffect, useState } from 'react';
import { Sparkles, RefreshCw, Loader2, ShoppingBag, Lightbulb, Target } from 'lucide-react';
import { AiTrendAnalysis } from '@/types';

export default function AiTrendCard() {
  const [data, setData] = useState<AiTrendAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTrends = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/ai/trends-today?t=${Date.now()}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        setError(json.error || 'Gagal memuat insight');
      }
    } catch {
      setError('Terjadi kesalahan koneksi ke AI');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 rounded-2xl shadow-xl text-white overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full -translate-y-40 translate-x-40 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-indigo-500/10 rounded-full translate-y-30 -translate-x-20 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-brand-accent/5 rounded-full blur-2xl" />

      <div className="p-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-wide">AI Market Intelligence</h2>
              <p className="text-[11px] text-white/40">Produk Natural & Healthy trending di marketplace</p>
            </div>
          </div>
          <button
            onClick={fetchTrends}
            disabled={loading}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50 border border-white/5"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-white/50 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading && !data ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-3" />
            <p className="text-sm text-white/40 animate-pulse">AI sedang menganalisa pasar...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 bg-white/5 rounded-xl border border-red-500/20">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        ) : data ? (
          <div className="space-y-5">
            {/* Key Insight */}
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
              <div className="flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-white/80 leading-relaxed italic">
                  &quot;{data.insight_utama}&quot;
                </p>
              </div>
            </div>

            {/* Products grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.products?.slice(0, 3).map((product, i) => (
                <div
                  key={i}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/8 transition-colors"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <ShoppingBag className="w-4 h-4 text-purple-300 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-white leading-tight">{product.nama_produk}</h4>
                      <p className="text-[10px] text-white/30 mt-0.5">{product.marketplace}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed mb-3">
                    {product.alasan_trending}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-purple-300/70">
                      ⏱ {product.estimasi_durasi}
                    </span>
                    <span className="text-[10px] font-semibold text-amber-400">
                      Skor: {product.skor_trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Business recommendation */}
            {data.rekomendasi_bisnis && (
              <div className="bg-gradient-to-r from-brand-primary/20 to-brand-primary/10 border border-brand-primary/20 p-4 rounded-xl">
                <div className="flex items-start gap-2.5">
                  <Target className="w-4 h-4 text-brand-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1">Rekomendasi Bisnis</p>
                    <p className="text-sm text-white/80">{data.rekomendasi_bisnis}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

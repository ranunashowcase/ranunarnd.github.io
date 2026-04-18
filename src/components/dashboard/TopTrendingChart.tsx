'use client';

import { useEffect, useState } from 'react';
import { Loader2, Sparkles, ShoppingBag, Star, Clock, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { AiTrendAnalysis, AiTrendProduct } from '@/types';

export default function TopTrendingChart() {
  const [data, setData] = useState<AiTrendAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ai/trends-today')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setData(json.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 min-h-[300px] flex flex-col items-center justify-center">
        <Loader2 className="w-6 h-6 text-purple-500 animate-spin mb-2" />
        <p className="text-xs text-gray-400 animate-pulse">AI menganalisa market...</p>
      </div>
    );
  }

  if (!data || !data.products || data.products.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 min-h-[300px] flex flex-col items-center justify-center">
        <Sparkles className="w-10 h-10 text-gray-200 mb-3" />
        <h3 className="text-sm font-semibold text-gray-500">AI Belum Tersedia</h3>
        <p className="text-xs text-gray-400 mt-1">Pastikan GROQ_API_KEY sudah dikonfigurasi</p>
      </div>
    );
  }

  const maxScore = Math.max(...data.products.map((p) => p.skor_trend || 0), 100);

  const getRecIcon = (rec: string) => {
    const r = rec.toLowerCase();
    if (r.includes('worth') || r.includes('bagus') || r.includes('recommended')) return <ThumbsUp className="w-3 h-3" />;
    if (r.includes('risk') || r.includes('saturated') || r.includes('avoid')) return <ThumbsDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getRecColor = (rec: string) => {
    const r = rec.toLowerCase();
    if (r.includes('worth') || r.includes('bagus') || r.includes('recommended')) return 'text-emerald-600 bg-emerald-50';
    if (r.includes('risk') || r.includes('saturated') || r.includes('avoid')) return 'text-red-500 bg-red-50';
    return 'text-amber-600 bg-amber-50';
  };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-50 bg-gradient-to-r from-purple-50 to-white">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-100">
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Top 5 Trending di Pasaran</h3>
            <p className="text-[11px] text-gray-400">AI analysis — produk natural & healthy</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {data.products.slice(0, 5).map((product, index) => {
          const percentage = ((product.skor_trend || 50) / maxScore) * 100;
          const barColors = [
            'from-purple-400 to-purple-600',
            'from-fuchsia-400 to-fuchsia-600',
            'from-pink-400 to-pink-600',
            'from-rose-400 to-rose-600',
            'from-red-400 to-red-500',
          ];

          return (
            <div key={index} className="group">
              <div className="flex items-center gap-3 mb-1.5">
                {/* Rank */}
                <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center text-[10px] font-bold text-purple-500 flex-shrink-0">
                  {index + 1}
                </div>

                {/* Marketplace icon */}
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="w-4 h-4 text-purple-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{product.nama_produk}</p>
                  <p className="text-[10px] text-gray-400">{product.marketplace}</p>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${getRecColor(product.rekomendasi)}`}>
                    {getRecIcon(product.rekomendasi)}
                    {product.rekomendasi}
                  </span>
                </div>
              </div>

              {/* Score bar */}
              <div className="ml-9 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${barColors[index]} transition-all duration-700`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Meta info */}
              <div className="ml-9 mt-1 flex items-center gap-3 text-[10px] text-gray-400">
                <span className="flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5" /> Skor: {product.skor_trend}
                </span>
                <span className="flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" /> {product.estimasi_durasi}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

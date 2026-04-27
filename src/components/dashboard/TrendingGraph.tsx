'use client';

import { useEffect, useState } from 'react';
import { Loader2, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import Image from 'next/image';

interface TrendMasterData {
  product_category: string;
  product_name: string;
  product_image_url: string;
  estimated_duration: string | number; // e.g. "6 Bulan" or 6
  trend_score: number; // e.g. 1 to 100
}

export default function TrendingGraph() {
  const [data, setData] = useState<TrendMasterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/trending-master')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || 'Gagal memuat data trending master');
        }
      })
      .catch((err) => {
        setError('Terjadi kesalahan koneksi');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6 flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-card border border-gray-100 p-8 text-center min-h-[300px] flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mb-3" />
        <h3 className="text-gray-900 font-semibold mb-1">Data Belum Tersedia</h3>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          {error || 'Silakan unggah Excel di menu Admin > Trending Master untuk memunculkan grafik prediksi tren.'}
        </p>
      </div>
    );
  }

  // Sort by trend_score descending if available
  const sortedData = [...data].sort((a, b) => {
    const scoreA = Number(a.trend_score) || 0;
    const scoreB = Number(b.trend_score) || 0;
    return scoreB - scoreA;
  });

  // Calculate max score for relative bar sizing
  const maxScore = Math.max(...sortedData.map(d => Number(d.trend_score) || 0), 100);

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden flex flex-col">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-brand-primary/10">
            <TrendingUp className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Trending Penjualan Live</h2>
            <p className="text-sm text-gray-500">Berdasarkan data pesanan harian</p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-6">
          {sortedData.map((item, index) => {
            const score = Number(item.trend_score) || (100 - (index * 10)); // dummy fallback
            const percentage = Math.min((score / maxScore) * 100, 100);
            const duration = item.estimated_duration || 'Unknown';
            
            return (
              <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative group">
                {/* Image Placeholder or Actual Image */}
                <div className="w-16 h-16 shrink-0 rounded-lg bg-gray-100 overflow-hidden relative border border-gray-200">
                  {item.product_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={item.product_image_url} 
                      alt={item.product_name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://archive.org/download/placeholder-image/placeholder-image.jpg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Img</div>
                  )}
                </div>

                {/* Content Area */}
                <div className="flex-1 w-full min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-xs font-semibold text-brand-primary tracking-wider uppercase mb-0.5 block">
                        {item.product_category || 'Kategori'}
                      </span>
                      <h4 className="text-sm font-bold text-gray-900 truncate">
                        {item.product_name || 'Nama Produk'}
                      </h4>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <div className="flex items-center text-xs font-semibold text-brand-primary bg-brand-primary/10 px-2 py-1 rounded">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {duration}
                      </div>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full h-2.5 bg-gray-100 rounded-full mt-2 overflow-hidden relative">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-primary-light relative"
                      style={{ width: `${percentage}%` }}
                    >
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

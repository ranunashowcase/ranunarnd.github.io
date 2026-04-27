'use client';

import { useEffect, useState } from 'react';
import { Loader2, TrendingUp } from 'lucide-react';

interface SalesProduct {
  nama_barang: string;
  sku_produk: string;
  barcode_produk: string;
  total_qty: number;
  image_url?: string;
  daily_data: { tanggal: string; qty: number }[];
}

export default function TopProductsChart() {
  const [data, setData] = useState<SalesProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sales-data')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json.data.slice(0, 5));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 min-h-[300px] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 min-h-[300px] flex flex-col items-center justify-center">
        <TrendingUp className="w-10 h-10 text-gray-200 mb-3" />
        <h3 className="text-sm font-semibold text-gray-500">Belum Ada Data Penjualan</h3>
        <p className="text-xs text-gray-400 mt-1">Data dari PEMESANAN PRODUK akan muncul di sini</p>
      </div>
    );
  }

  const maxQty = Math.max(...data.map((d) => d.total_qty), 1);

  const barColors = [
    'from-emerald-400 to-emerald-600',
    'from-teal-400 to-teal-600',
    'from-cyan-400 to-cyan-600',
    'from-sky-400 to-sky-600',
    'from-blue-400 to-blue-600',
  ];

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-50 bg-gradient-to-r from-emerald-50 to-white">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-100">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Top 5 Produk Naik</h3>
            <p className="text-[11px] text-gray-400">Berdasarkan total penjualan</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {data.map((product, index) => {
          const percentage = (product.total_qty / maxQty) * 100;
          return (
            <div key={product.barcode_produk || index} className="group">
              <div className="flex items-center gap-3 mb-1.5">
                {/* Rank badge */}
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 flex-shrink-0">
                  {index + 1}
                </div>

                {/* Product image */}
                <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image_url}
                      alt={product.nama_barang}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-300">IMG</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{product.nama_barang}</p>
                  <p className="text-[10px] text-gray-400">{product.sku_produk}</p>
                </div>
                <span className="text-xs font-bold text-emerald-600 flex-shrink-0">{product.total_qty} pcs</span>
              </div>

              {/* Bar */}
              <div className="ml-9 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${barColors[index]} transition-all duration-700`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Mini sparkline dots */}
              {product.daily_data.length > 0 && (
                <div className="ml-9 mt-1.5 flex items-end gap-[2px] h-4">
                  {product.daily_data.slice(-14).map((day, i) => {
                    const maxDay = Math.max(...product.daily_data.slice(-14).map((d) => d.qty), 1);
                    const h = Math.max((day.qty / maxDay) * 16, 2);
                    return (
                      <div
                        key={i}
                        className={`w-1.5 rounded-full bg-gradient-to-t ${barColors[index]} opacity-60`}
                        style={{ height: `${h}px` }}
                        title={`${day.tanggal}: ${day.qty} pcs`}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

import TrendCard from '@/components/dashboard/TrendCard';
import { MarketTrend } from '@/types';
import { TrendingUp, PlusCircle } from 'lucide-react';
import Link from 'next/link';

async function fetchTrends(): Promise<MarketTrend[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/trends`, { cache: 'no-store' });
    const json = await res.json();
    return json.success ? json.data : [];
  } catch {
    return [];
  }
}

export default async function TrendsPage() {
  const trends = await fetchTrends();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Market Trends</h1>
          <p className="text-sm text-gray-500 mt-1">Analisis tren pasar terkini — {trends.length} tren</p>
        </div>
        <Link href="/admin/trends" className="btn-primary">
          <PlusCircle className="w-4 h-4" />
          Tambah Tren
        </Link>
      </div>

      {trends.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trends.map((trend, i) => (
            <TrendCard key={trend.trend_id} trend={trend} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <TrendingUp className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Belum Ada Tren</h3>
          <p className="text-gray-400 text-sm mb-4">Mulai dengan menambahkan data tren pasar pertama</p>
          <Link href="/admin/trends" className="btn-primary">
            <PlusCircle className="w-4 h-4" />
            Tambah Tren Pertama
          </Link>
        </div>
      )}
    </div>
  );
}

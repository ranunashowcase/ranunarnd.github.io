import TrendForm from '@/components/forms/TrendForm';
import { TrendingUp, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminTrendsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/trends" className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Trends
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50">
            <TrendingUp className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Input Market Trend</h1>
            <p className="text-sm text-gray-500">Tambahkan data tren pasar terbaru</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
        <TrendForm />
      </div>
    </div>
  );
}

import { TrendingUp, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import MarketWatchForm from '@/components/forms/MarketWatchForm';

export default function MarketWatchPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/dashboard" className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-brand-primary/10">
            <TrendingUp className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Input Market Watch (Medsos)</h1>
            <p className="text-sm text-gray-500">Menganalisis ide luar & tren kompetitor dengan AI</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
        <MarketWatchForm />
      </div>
    </div>
  );
}

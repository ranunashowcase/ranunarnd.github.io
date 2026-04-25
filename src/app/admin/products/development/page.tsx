import { Box, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import DevelopmentRndForm from '@/components/forms/DevelopmentRndForm';

export default function DevelopmentTrackerPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/dashboard" className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-brand-primary/10">
            <Box className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">R&D Tracker (Development)</h1>
            <p className="text-sm text-gray-500">Mencatat progress R&D dipadu prediksi rentang tren dari AI</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
        <DevelopmentRndForm />
      </div>
    </div>
  );
}

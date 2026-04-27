import { ArrowLeft, Beaker } from 'lucide-react';
import Link from 'next/link';

export default function FormulationPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/dashboard" className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10">
            <Beaker className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Recipe & Formulation Tracker</h1>
            <p className="text-sm text-gray-500">Kalkulasi presisi HPP/COGS berbasis dinamika harga bahan baku</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <Beaker className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Modul Formulasi Sedang Dibangun</h2>
        <p className="text-gray-500 max-w-md mx-auto text-sm">
          Fitur ini akan segera memungkinkan Anda menyusun resep produk dan mensimulasikan perubahan HPP secara *real-time* berbasis perubahan harga di pasar.
        </p>
      </div>
    </div>
  );
}

import { ArrowLeft, Database } from 'lucide-react';
import Link from 'next/link';
import UploadExcelForm from '@/components/forms/UploadExcelForm';

export default function TrendingMasterPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/dashboard" className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-green-500/10">
            <Database className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Data Trending Master</h1>
            <p className="text-sm text-gray-500">Upload dan sinkronisasi data tren (Excel) ke sistem</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Panduan Format Excel</h2>
        <p className="text-sm text-gray-600 mb-6">
          Sistem membaca baris pertama sebagai Header. Pastikan Excel Anda minimal memiliki kolom berikut: <br/>
          <code className="text-xs bg-gray-100 px-2 py-1 rounded">product_category</code>, 
          <code className="text-xs bg-gray-100 px-2 py-1 rounded ml-1">product_name</code>, 
          <code className="text-xs bg-gray-100 px-2 py-1 rounded ml-1">product_image_url</code>, 
          <code className="text-xs bg-gray-100 px-2 py-1 rounded ml-1">estimated_duration</code>.
        </p>

        <UploadExcelForm />
      </div>
    </div>
  );
}

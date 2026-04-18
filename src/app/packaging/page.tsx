import PackagingCard from '@/components/dashboard/PackagingCard';
import { PackagingAnalysis } from '@/types';
import { Box, PlusCircle } from 'lucide-react';
import Link from 'next/link';

async function fetchPackaging(): Promise<PackagingAnalysis[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/packaging`, { cache: 'no-store' });
    const json = await res.json();
    return json.success ? json.data : [];
  } catch {
    return [];
  }
}

export default async function PackagingPage() {
  const packaging = await fetchPackaging();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Packaging Analysis</h1>
          <p className="text-sm text-gray-500 mt-1">Riset dan analisis packaging — {packaging.length} entries</p>
        </div>
        <Link href="/admin/packaging" className="btn-primary">
          <PlusCircle className="w-4 h-4" />
          Tambah Packaging
        </Link>
      </div>

      {packaging.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packaging.map((pkg, i) => (
            <PackagingCard key={pkg.packaging_id} packaging={pkg} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <Box className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Belum Ada Data Packaging</h3>
          <p className="text-gray-400 text-sm mb-4">Mulai dengan menambahkan analisis packaging pertama</p>
          <Link href="/admin/packaging" className="btn-primary">
            <PlusCircle className="w-4 h-4" />
            Tambah Packaging Pertama
          </Link>
        </div>
      )}
    </div>
  );
}

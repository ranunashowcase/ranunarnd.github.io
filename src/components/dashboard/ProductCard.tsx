'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import { formatRupiah, formatDate } from '@/lib/utils';
import { Package, Calendar, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleDelete = async () => {
    if (!window.confirm(`Yakin ingin menghapus produk "${product.product_name}"?`)) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/products/${product.product_id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        showToast('Produk berhasil dihapus', 'success');
        router.refresh(); // Refresh data in server components
      } else {
        showToast(data.error || 'Gagal menghapus produk', 'error');
      }
    } catch (error) {
      showToast('Terjadi kesalahan', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 p-5 shadow-card hover:shadow-card-hover transition-all duration-300 animate-slide-up group relative ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Delete Button (Visible on Hover) */}
      <button
        onClick={handleDelete}
        className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200"
        title="Hapus Produk"
      >
        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-4 h-4" />}
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-3 pr-8">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-brand-primary/5 group-hover:bg-brand-primary/10 transition-colors">
            <Package className="w-4 h-4 text-brand-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-900 leading-tight">{product.product_name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{product.product_id}</p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <span
          className={`badge ${
            product.status === 'live' ? 'badge-live' : 'badge-development'
          }`}
        >
          {product.status}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Kategori</span>
          <span className="font-medium text-gray-700 bg-gray-50 px-2 py-0.5 rounded">{product.category}</span>
        </div>
        {product.nutrition_highlight && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Nutrisi</span>
            <span className="font-medium text-gray-700 text-right max-w-[60%] truncate" title={product.nutrition_highlight}>
              {product.nutrition_highlight}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">COGS (HPP)</span>
          <span className="font-bold text-brand-primary">{formatRupiah(product.cogs)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400 border-t border-gray-50 pt-3">
        <Calendar className="w-3.5 h-3.5" />
        <span>{formatDate(product.created_at)}</span>
      </div>
    </div>
  );
}

import { PackagingAnalysis } from '@/types';
import { formatRupiah, formatDate } from '@/lib/utils';
import { Box, Calendar, ExternalLink, Layers } from 'lucide-react';

interface PackagingCardProps {
  packaging: PackagingAnalysis;
  index?: number;
}

export default function PackagingCard({ packaging, index = 0 }: PackagingCardProps) {
  return (
    <div
      className="bg-white rounded-xl border border-gray-100 p-5 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 animate-slide-up group"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-purple-50 group-hover:bg-purple-100 transition-colors">
            <Box className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-900 leading-tight">{packaging.target_product}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{packaging.packaging_id}</p>
          </div>
        </div>
        <span className="badge bg-purple-50 text-purple-700">{packaging.packaging_type}</span>
      </div>

      {/* Details Grid */}
      <div className="space-y-2 mb-4">
        <div className="flex items-start gap-2 text-sm">
          <Layers className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-gray-500 text-xs">Material</span>
            <p className="font-medium text-gray-700 text-sm">{packaging.material_specs}</p>
          </div>
        </div>

        {packaging.current_trend && (
          <div className="text-sm">
            <span className="text-gray-500 text-xs">Tren Saat Ini</span>
            <p className="font-medium text-gray-600 text-sm italic">&ldquo;{packaging.current_trend}&rdquo;</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 text-center bg-gray-50 rounded-lg p-2.5">
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-medium">MOQ</p>
            <p className="text-sm font-bold text-gray-700">{packaging.moq.toLocaleString()}</p>
          </div>
          <div className="border-x border-gray-200">
            <p className="text-[10px] text-gray-400 uppercase font-medium">Harga/pcs</p>
            <p className="text-sm font-bold text-brand-primary">{formatRupiah(packaging.price_per_pcs)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-medium">Per Karton</p>
            <p className="text-sm font-bold text-gray-700">{packaging.qty_per_carton}</p>
          </div>
        </div>

        {packaging.arrangement_layout && (
          <div className="text-sm">
            <span className="text-gray-500 text-xs">Layout</span>
            <p className="font-medium text-gray-700 text-sm">{packaging.arrangement_layout}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-50 pt-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formatDate(packaging.created_at)}</span>
        </div>
        {packaging.visual_reference_url && (
          <a
            href={packaging.visual_reference_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-brand-primary hover:text-brand-primary-light transition-colors font-medium"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Referensi
          </a>
        )}
      </div>
    </div>
  );
}

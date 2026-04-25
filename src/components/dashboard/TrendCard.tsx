import { MarketTrend } from '@/types';
import { formatRupiah, formatDate } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Calendar, Users } from 'lucide-react';

interface TrendCardProps {
  trend: MarketTrend;
  index?: number;
}

const trendIcons = {
  naik: TrendingUp,
  turun: TrendingDown,
  stabil: Minus,
};

const trendStyles = {
  naik: { badge: 'badge-naik', bg: 'bg-emerald-50', icon: 'text-status-success' },
  turun: { badge: 'badge-turun', bg: 'bg-red-50', icon: 'text-status-danger' },
  stabil: { badge: 'badge-stabil', bg: 'bg-gray-50', icon: 'text-gray-500' },
};

export default function TrendCard({ trend, index = 0 }: TrendCardProps) {
  const TrendIcon = trendIcons[trend.trend_status] || Minus;
  const style = trendStyles[trend.trend_status] || trendStyles.stabil;

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 p-5 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 animate-slide-up group"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg ${style.bg} transition-colors`}>
            <TrendIcon className={`w-4 h-4 ${style.icon}`} />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-900 leading-tight">{trend.trend_name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{trend.trend_id}</p>
          </div>
        </div>
        <span className={`badge ${style.badge}`}>{trend.trend_status}</span>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-start gap-2 text-sm">
          <Users className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-gray-500 text-xs">Target Market</span>
            <p className="font-medium text-gray-700 text-sm">{trend.target_market}</p>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Harga Kompetitor</span>
          <span className="font-bold text-brand-accent-dark">{formatRupiah(trend.competitor_price)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400 border-t border-gray-50 pt-3">
        <Calendar className="w-3.5 h-3.5" />
        <span>{formatDate(trend.created_at)}</span>
      </div>
    </div>
  );
}

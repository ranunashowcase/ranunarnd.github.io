import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'green' | 'gold' | 'blue' | 'purple';
}

const colorMap = {
  green: {
    bg: 'bg-emerald-50',
    icon: 'bg-emerald-100 text-emerald-600',
    value: 'text-emerald-700',
  },
  gold: {
    bg: 'bg-amber-50',
    icon: 'bg-amber-100 text-amber-600',
    value: 'text-amber-700',
  },
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-100 text-blue-600',
    value: 'text-blue-700',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-100 text-purple-600',
    value: 'text-purple-700',
  },
};

export default function StatsCard({ title, value, subtitle, icon: Icon, color }: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <div className={`rounded-xl p-5 ${colors.bg} border border-white/50 animate-fade-in transition-all duration-200 hover:shadow-card-hover hover:scale-[1.02]`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${colors.value}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${colors.icon}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

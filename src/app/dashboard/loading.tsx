import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-7 bg-gray-200 rounded-lg w-40 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-72" />
      </div>

      {/* Quick actions skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-2xl" />
        ))}
      </div>

      {/* AI Card skeleton */}
      <div className="h-64 bg-gray-200 rounded-2xl" />

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-gray-200 rounded-2xl" />
        <div className="h-80 bg-gray-200 rounded-2xl" />
      </div>
    </div>
  );
}

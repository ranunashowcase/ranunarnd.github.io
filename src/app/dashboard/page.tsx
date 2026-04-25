import QuickActions from '@/components/dashboard/QuickActions';
import AiTrendCard from '@/components/dashboard/AiTrendCard';
import TopProductsChart from '@/components/dashboard/TopProductsChart';
import TopTrendingChart from '@/components/dashboard/TopTrendingChart';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">
          R&D Intelligence System — PT. Shalee Berkah Jaya
        </p>
      </div>

      {/* Quick Actions */}
      <section>
        <QuickActions />
      </section>

      {/* AI Market Intelligence */}
      <section>
        <AiTrendCard />
      </section>

      {/* Dual Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopProductsChart />
        <TopTrendingChart />
      </section>
    </div>
  );
}

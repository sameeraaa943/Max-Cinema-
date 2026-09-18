import WelcomeSection from './WelcomeSection';
import StatCards from './StatCards';
import OverviewChart from './OverviewChart';
import TopMovies from './TopMovies';
import RecentActivity from './RecentActivity';
import QuickActions from './QuickActions';
import SystemStatus from './SystemStatus';

export default function Dashboard() {
  return (
    <main className="flex-1 overflow-y-auto" style={{ background: '#070707' }}>
      <div className="max-w-screen-2xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">

        {/* Welcome */}
        <WelcomeSection />

        {/* Stat Cards */}
        <StatCards />

        {/* Chart + Top Movies */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          <div className="xl:col-span-2">
            <OverviewChart />
          </div>
          <div className="xl:col-span-1">
            <TopMovies />
          </div>
        </div>

        {/* Recent Activity + Quick Actions + System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-1">
            <RecentActivity />
          </div>
          <div className="lg:col-span-1">
            <QuickActions />
          </div>
          <div className="lg:col-span-1">
            <SystemStatus />
          </div>
        </div>

        {/* Bottom spacing */}
        <div style={{ height: '16px' }} />
      </div>
    </main>
  );
}


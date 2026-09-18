import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import {
  Film,
  Tv,
  Star,
  Eye,
  TrendingUp,
  Plus,
  ArrowUpRight,
  RefreshCw,
  Database,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { moviesApi, tvShowsApi, featuredApi, analyticsApi, healthApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d' | '90d'>('7d');

  // Queries
  const { data: moviesData, isLoading: moviesLoading } = useQuery({
    queryKey: ['movies-count'],
    queryFn: () => moviesApi.list({ limit: 1 }),
  });

  const { data: tvData, isLoading: tvLoading } = useQuery({
    queryKey: ['tv-count'],
    queryFn: () => tvShowsApi.list({ limit: 1 }),
  });

  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ['featured-count'],
    queryFn: () => featuredApi.list(),
  });

  const { data: analyticsData, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery({
    queryKey: ['dashboard-analytics', chartPeriod],
    queryFn: () => analyticsApi.get(chartPeriod),
  });

  const { data: healthData } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => healthApi.check(),
    refetchInterval: 30000,
  });

  const totalMovies = moviesData?.data?.data?.total ?? 0;
  const totalTV = tvData?.data?.data?.total ?? 0;
  const totalFeatured = featuredData?.data?.data?.length ?? 0;
  const totalViews = analyticsData?.data?.data?.totalPageViews ?? 0;

  const chartData = analyticsData?.data?.data?.chartData || [];
  const topMovies = analyticsData?.data?.data?.topMovies || [];

  const isDbConnected = healthData?.data?.database === 'connected';

  const todayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div
        className="rounded-2xl p-6 sm:p-8 relative overflow-hidden card-hover"
        style={{
          background: 'linear-gradient(135deg, #161616 0%, #0e0e0e 100%)',
          border: '1px solid #242424',
        }}
      >
        <div
          className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted mb-2">
              <Clock size={14} style={{ color: '#D4AF37' }} />
              <span>{todayStr}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-cinzel">
              Welcome back, <span className="gold-text">{user?.name || 'Administrator'}</span>
            </h1>
            <p className="text-sm text-muted mt-1 max-w-xl">
              CineScope Control Dashboard V2 is actively synced with Supabase PostgreSQL and Render API.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/movies/new"
              className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all btn-gold"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)',
                color: '#070707',
              }}
            >
              <Plus size={16} />
              <span>Add Movie</span>
            </Link>
            <Link
              to="/tv-shows/new"
              className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid #242424',
                color: '#FFFFFF',
              }}
            >
              <Plus size={16} />
              <span>Add TV Show</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Movies */}
        <div
          className="rounded-xl p-5 card-hover transition-all"
          style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">Total Movies</span>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(212,175,55,0.1)', color: '#D4AF37' }}
            >
              <Film size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono">
              {moviesLoading ? '...' : totalMovies.toLocaleString()}
            </div>
            <Link to="/movies" className="text-xs mt-1 text-muted hover:text-white flex items-center gap-1 transition-colors">
              <span>Manage catalog</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>

        {/* Total TV Shows */}
        <div
          className="rounded-xl p-5 card-hover transition-all"
          style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">TV Shows</span>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}
            >
              <Tv size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono">
              {tvLoading ? '...' : totalTV.toLocaleString()}
            </div>
            <Link to="/tv-shows" className="text-xs mt-1 text-muted hover:text-white flex items-center gap-1 transition-colors">
              <span>Manage series</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>

        {/* Featured Items */}
        <div
          className="rounded-xl p-5 card-hover transition-all"
          style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">Featured Items</span>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(234,179,8,0.1)', color: '#facc15' }}
            >
              <Star size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono">
              {featuredLoading ? '...' : totalFeatured.toLocaleString()}
            </div>
            <Link to="/featured" className="text-xs mt-1 text-muted hover:text-white flex items-center gap-1 transition-colors">
              <span>Configure featured</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>

        {/* Total Tracked Views */}
        <div
          className="rounded-xl p-5 card-hover transition-all"
          style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">Tracked Views</span>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#4ade80' }}
            >
              <Eye size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono">
              {analyticsLoading ? '...' : totalViews.toLocaleString()}
            </div>
            <Link to="/analytics" className="text-xs mt-1 text-muted hover:text-white flex items-center gap-1 transition-colors">
              <span>Live analytics</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart + Top Movies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div
          className="lg:col-span-2 rounded-xl p-6 card-hover"
          style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-semibold text-white">Audience Engagement</h2>
              <p className="text-xs text-muted">Real page views and content interactions</p>
            </div>

            <div className="flex items-center gap-2">
              {(['7d', '30d', '90d'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                  style={{
                    backgroundColor: chartPeriod === p ? '#D4AF37' : 'rgba(255,255,255,0.04)',
                    color: chartPeriod === p ? '#070707' : '#8A8A8A',
                    fontWeight: chartPeriod === p ? 700 : 500,
                  }}
                >
                  {p.toUpperCase()}
                </button>
              ))}
              <button
                onClick={() => refetchAnalytics()}
                className="p-1.5 rounded-lg text-muted hover:text-white transition-colors"
                title="Refresh analytics"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          <div style={{ height: '280px', width: '100%' }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="moviesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                  <XAxis dataKey="label" stroke="#666666" fontSize={11} tickLine={false} />
                  <YAxis stroke="#666666" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#161616',
                      borderColor: '#242424',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="pageViews"
                    name="Page Views"
                    stroke="#D4AF37"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#viewsGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="movieViews"
                    name="Movie Views"
                    stroke="#60a5fa"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#moviesGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <TrendingUp size={32} className="text-muted mb-2 opacity-50" />
                <p className="text-sm text-muted">No analytics events recorded yet.</p>
                <p className="text-xs text-muted/60 mt-1 max-w-sm">
                  Visitor events will plot here as visitors browse the public CineScope website.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions & System Health */}
        <div className="space-y-6">
          {/* System Status Panel */}
          <div
            className="rounded-xl p-5 card-hover"
            style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">System Connectivity</h3>
              <Database size={16} style={{ color: '#D4AF37' }} />
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-[#1f1f1f]">
                <span className="text-muted">Database</span>
                <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                  <CheckCircle size={14} />
                  <span>PostgreSQL (Supabase)</span>
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#1f1f1f]">
                <span className="text-muted">API Layer</span>
                <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                  <CheckCircle size={14} />
                  <span>Render Express</span>
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#1f1f1f]">
                <span className="text-muted">Public Site</span>
                <a
                  href="https://cinescopecodespactor.netlify.app"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 font-medium hover:underline text-[#D4AF37]"
                >
                  <span>cinescope.netlify.app</span>
                  <ArrowUpRight size={12} />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Nav Shortcuts */}
          <div
            className="rounded-xl p-5 card-hover"
            style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
          >
            <h3 className="text-sm font-semibold text-white mb-3">Quick Navigation</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate('/movies')}
                className="p-3 rounded-lg text-left transition-colors text-xs font-medium flex items-center gap-2"
                style={{ backgroundColor: '#161616', color: '#D4AF37', border: '1px solid #242424' }}
              >
                <Film size={14} />
                <span>Movies</span>
              </button>
              <button
                onClick={() => navigate('/tv-shows')}
                className="p-3 rounded-lg text-left transition-colors text-xs font-medium flex items-center gap-2"
                style={{ backgroundColor: '#161616', color: '#60a5fa', border: '1px solid #242424' }}
              >
                <Tv size={14} />
                <span>TV Shows</span>
              </button>
              <button
                onClick={() => navigate('/featured')}
                className="p-3 rounded-lg text-left transition-colors text-xs font-medium flex items-center gap-2"
                style={{ backgroundColor: '#161616', color: '#facc15', border: '1px solid #242424' }}
              >
                <Star size={14} />
                <span>Featured</span>
              </button>
              <button
                onClick={() => navigate('/homepage')}
                className="p-3 rounded-lg text-left transition-colors text-xs font-medium flex items-center gap-2"
                style={{ backgroundColor: '#161616', color: '#c084fc', border: '1px solid #242424' }}
              >
                <TrendingUp size={14} />
                <span>Homepage</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


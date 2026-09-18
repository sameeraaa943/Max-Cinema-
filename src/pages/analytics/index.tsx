import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart2,
  Calendar,
  Eye,
  Film,
  Tv,
  Search,
  Users,
  Code,
  Copy,
  Check,
  RefreshCw,
  TrendingUp,
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
import { toast } from 'sonner';
import { analyticsApi } from '../../services/api';
import { AnalyticsSummary } from '../../types';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<string>('7d');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['analytics-full', period],
    queryFn: () => analyticsApi.get(period),
  });

  const analytics: AnalyticsSummary | null = data?.data?.data || null;

  const totalPageViews = analytics?.totalPageViews ?? 0;
  const uniqueVisitors = analytics?.uniqueVisitors ?? 0;
  const movieViews = analytics?.movieViews ?? 0;
  const tvViews = analytics?.tvViews ?? 0;
  const searches = analytics?.searches ?? 0;

  const chartData = analytics?.chartData || [];
  const topMovies = analytics?.topMovies || [];
  const topTVShows = analytics?.topTVShows || [];
  const topSearches = analytics?.topSearches || [];

  const hasData = totalPageViews > 0 || movieViews > 0 || tvViews > 0 || searches > 0;

  const trackerSnippet = `<script>
  (function() {
    window.CINESCOPE_API = "https://your-render-api.onrender.com";
    var s = document.createElement("script");
    s.src = window.CINESCOPE_API + "/api/public/analytics/tracker.js";
    s.async = true;
    document.head.appendChild(s);
  })();
</script>`;

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(trackerSnippet);
    setCopiedSnippet(true);
    toast.success('Analytics snippet copied to clipboard');
    setTimeout(() => setCopiedSnippet(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-cinzel tracking-wide flex items-center gap-2">
            <BarChart2 size={22} style={{ color: '#D4AF37' }} />
            <span>Real Analytics & Insights</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Privacy-conscious telemetry collected directly from CineScope visitor interactions
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#121212] border border-[#242424]">
          {[
            { label: 'Today', value: '1d' },
            { label: '7 Days', value: '7d' },
            { label: '30 Days', value: '30d' },
            { label: '90 Days', value: '90d' },
            { label: '1 Year', value: '1y' },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setPeriod(item.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: period === item.value ? '#D4AF37' : 'transparent',
                color: period === item.value ? '#070707' : '#8A8A8A',
                fontWeight: period === item.value ? 700 : 500,
              }}
            >
              {item.label}
            </button>
          ))}

          <button
            onClick={() => refetch()}
            className="p-1.5 text-muted hover:text-white transition-colors"
            title="Refresh Data"
          >
            <RefreshCw size={14} className={isRefetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton lines={6} height="70px" />
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl card-hover" style={{ backgroundColor: '#121212', border: '1px solid #242424' }}>
              <div className="flex items-center justify-between text-muted text-xs mb-2">
                <span>Page Views</span>
                <Eye size={16} style={{ color: '#D4AF37' }} />
              </div>
              <div className="text-2xl font-bold text-white font-mono">{totalPageViews.toLocaleString()}</div>
            </div>

            <div className="p-4 rounded-xl card-hover" style={{ backgroundColor: '#121212', border: '1px solid #242424' }}>
              <div className="flex items-center justify-between text-muted text-xs mb-2">
                <span>Unique Sessions</span>
                <Users size={16} style={{ color: '#38bdf8' }} />
              </div>
              <div className="text-2xl font-bold text-white font-mono">{uniqueVisitors.toLocaleString()}</div>
            </div>

            <div className="p-4 rounded-xl card-hover" style={{ backgroundColor: '#121212', border: '1px solid #242424' }}>
              <div className="flex items-center justify-between text-muted text-xs mb-2">
                <span>Movie Views</span>
                <Film size={16} style={{ color: '#facc15' }} />
              </div>
              <div className="text-2xl font-bold text-white font-mono">{movieViews.toLocaleString()}</div>
            </div>

            <div className="p-4 rounded-xl card-hover" style={{ backgroundColor: '#121212', border: '1px solid #242424' }}>
              <div className="flex items-center justify-between text-muted text-xs mb-2">
                <span>TV Show Views</span>
                <Tv size={16} style={{ color: '#60a5fa' }} />
              </div>
              <div className="text-2xl font-bold text-white font-mono">{tvViews.toLocaleString()}</div>
            </div>

            <div className="p-4 rounded-xl card-hover" style={{ backgroundColor: '#121212', border: '1px solid #242424' }}>
              <div className="flex items-center justify-between text-muted text-xs mb-2">
                <span>Site Searches</span>
                <Search size={16} style={{ color: '#c084fc' }} />
              </div>
              <div className="text-2xl font-bold text-white font-mono">{searches.toLocaleString()}</div>
            </div>
          </div>

          {/* Chart Card */}
          <div className="p-6 rounded-xl" style={{ backgroundColor: '#121212', border: '1px solid #242424' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-white">Event Trend Timeline</h2>
                <p className="text-xs text-muted">Audience activity across the selected timeframe</p>
              </div>
            </div>

            {hasData && chartData.length > 0 ? (
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="pageViewsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="movieViewsGrad" x1="0" y1="0" x2="0" y2="1">
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
                      fill="url(#pageViewsGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="movieViews"
                      name="Movie Views"
                      stroke="#60a5fa"
                      strokeWidth={1.5}
                      fillOpacity={1}
                      fill="url(#movieViewsGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-14 text-center">
                <BarChart2 size={36} className="mx-auto text-muted/30 mb-2" />
                <p className="text-sm font-semibold text-white">No analytics data available</p>
                <p className="text-xs text-muted max-w-sm mx-auto mt-1 leading-relaxed">
                  Real visitor events will populate here automatically once the tracking snippet is installed on the public CineScope site.
                </p>
              </div>
            )}
          </div>

          {/* Tables Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Movies */}
            <div className="p-5 rounded-xl" style={{ backgroundColor: '#121212', border: '1px solid #242424' }}>
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Film size={15} style={{ color: '#D4AF37' }} />
                <span>Most Viewed Movies</span>
              </h3>
              {topMovies.length === 0 ? (
                <p className="text-xs text-muted text-center py-6">No movie view data</p>
              ) : (
                <div className="space-y-2">
                  {topMovies.map((m, idx) => (
                    <div key={m.id} className="flex items-center justify-between text-xs py-1.5 border-b border-[#1f1f1f]">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-muted text-[10px]">#{idx + 1}</span>
                        <span className="text-white truncate">{m.title}</span>
                      </div>
                      <span className="font-mono font-semibold text-[#D4AF37] ml-2 flex-shrink-0">
                        {m.views.toLocaleString()} views
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top TV Shows */}
            <div className="p-5 rounded-xl" style={{ backgroundColor: '#121212', border: '1px solid #242424' }}>
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Tv size={15} style={{ color: '#60a5fa' }} />
                <span>Most Viewed TV Shows</span>
              </h3>
              {topTVShows.length === 0 ? (
                <p className="text-xs text-muted text-center py-6">No series view data</p>
              ) : (
                <div className="space-y-2">
                  {topTVShows.map((t, idx) => (
                    <div key={t.id} className="flex items-center justify-between text-xs py-1.5 border-b border-[#1f1f1f]">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-muted text-[10px]">#{idx + 1}</span>
                        <span className="text-white truncate">{t.title}</span>
                      </div>
                      <span className="font-mono font-semibold text-blue-400 ml-2 flex-shrink-0">
                        {t.views.toLocaleString()} views
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Searches */}
            <div className="p-5 rounded-xl" style={{ backgroundColor: '#121212', border: '1px solid #242424' }}>
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Search size={15} style={{ color: '#c084fc' }} />
                <span>Popular Search Queries</span>
              </h3>
              {topSearches.length === 0 ? (
                <p className="text-xs text-muted text-center py-6">No search data</p>
              ) : (
                <div className="space-y-2">
                  {topSearches.map((s) => (
                    <div key={s.query} className="flex items-center justify-between text-xs py-1.5 border-b border-[#1f1f1f]">
                      <span className="text-white truncate font-mono">"{s.query}"</span>
                      <span className="font-mono text-purple-400 ml-2 flex-shrink-0">
                        {s.count} searches
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Integration Guide Snippet Box */}
          <div
            className="rounded-xl p-6 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(212,175,55,0.05) 0%, rgba(18,18,18,0.9) 100%)',
              border: '1px solid rgba(212,175,55,0.3)',
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Code size={16} style={{ color: '#D4AF37' }} />
                  <h3 className="text-sm font-semibold text-white">Public Site Tracker Integration</h3>
                </div>
                <p className="text-xs text-muted max-w-2xl leading-relaxed">
                  To collect real events from your public website at <code className="text-[#D4AF37]">https://cinescopecodespactor.netlify.app</code>, insert this script tag before the closing <code className="text-white">&lt;/head&gt;</code> or use our public integration module.
                </p>
              </div>

              <button
                onClick={handleCopySnippet}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold btn-gold flex items-center gap-1.5 flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)',
                  color: '#070707',
                }}
              >
                {copiedSnippet ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedSnippet ? 'Copied' : 'Copy Script'}</span>
              </button>
            </div>

            <pre
              className="mt-4 p-3 rounded-lg text-[11px] font-mono text-gray-300 overflow-x-auto"
              style={{ backgroundColor: '#070707', border: '1px solid #242424' }}
            >
              {trackerSnippet}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}


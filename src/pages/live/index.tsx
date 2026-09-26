import { useState, useEffect, useMemo } from 'react';
import { Radio, Users, Eye, Film, Tv, Search, Activity, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { searchAnalyticsApi } from '../../services/api';

interface LiveEvent {
  type: 'PAGE_VIEW' | 'MOVIE_VIEW' | 'TV_VIEW' | 'SEARCH' | 'CUSTOM';
  title?: string;
  url?: string;
  query?: string;
  timestamp: string;
}

interface LiveData {
  events: LiveEvent[];
}

const EVENT_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  PAGE_VIEW:  { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  icon: Eye,    label: 'Page View'   },
  MOVIE_VIEW: { color: '#D4AF37', bg: 'rgba(212,175,55,0.12)',  icon: Film,   label: 'Movie View'  },
  TV_VIEW:    { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: Tv,     label: 'TV View'     },
  SEARCH:     { color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  icon: Search, label: 'Search'      },
  CUSTOM:     { color: '#8A8A8A', bg: 'rgba(138,138,138,0.12)', icon: Activity,label: 'Custom'     },
};

function timeAgo(ts: string) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function LiveActivityPage() {
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [secondsSince, setSecondsSince] = useState(0);

  const { data, isLoading } = useQuery<LiveData>({
    queryKey: ['live-activity'],
    queryFn: () => searchAnalyticsApi.getLive().then((r: any) => r.data.data),
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (data) setLastRefreshed(new Date());
  }, [data]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsSince(Math.floor((Date.now() - lastRefreshed.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastRefreshed]);

  const events: LiveEvent[] = useMemo(() => {
    if (!data?.events) return [];
    return [...data.events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 40);
  }, [data]);

  const stats = useMemo(() => {
    if (!events.length) return { total: 0, movies: 0, tv: 0, searches: 0, topContent: [] as string[] };
    const now = Date.now();
    const last24h = events.filter(e => now - new Date(e.timestamp).getTime() < 86400000);
    const movies = last24h.filter(e => e.type === 'MOVIE_VIEW').length;
    const tv = last24h.filter(e => e.type === 'TV_VIEW').length;
    const searches = last24h.filter(e => e.type === 'SEARCH').length;
    const contentCount: Record<string, number> = {};
    last24h.filter(e => e.title).forEach(e => {
      contentCount[e.title!] = (contentCount[e.title!] || 0) + 1;
    });
    const topContent = Object.entries(contentCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);
    return { total: last24h.length, movies, tv, searches, topContent };
  }, [events]);

  return (
    <div style={{ minHeight: '100vh', background: '#070707', padding: '32px 24px', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{ background: '#1a1a1a', border: '1px solid #242424', borderRadius: 10, padding: 10 }}>
            <Radio size={22} color="#D4AF37" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff' }}>Live Activity</h1>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block', animation: 'liveBlip 1.4s ease-in-out infinite' }} />
                LIVE
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#8A8A8A' }}>Auto-refreshes every 30s</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, color: '#8A8A8A', gap: 10 }}>
          <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Connecting to live stream…</span>
        </div>
      ) : !events.length ? (
        <div style={{ background: '#121212', border: '1px solid #242424', borderRadius: 12, padding: 60, textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', animation: 'pulse 2s infinite' }}>
            <Activity size={28} color="#D4AF37" />
          </div>
          <h3 style={{ margin: '0 0 8px', color: '#fff', fontSize: 18 }}>Waiting for live events…</h3>
          <p style={{ margin: 0, color: '#8A8A8A', fontSize: 14 }}>Events will appear here in real time as visitors interact with your site.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.7fr) minmax(0,1fr)', gap: 20, alignItems: 'start' }}>
          {/* LEFT: Event Feed */}
          <div style={{ background: '#121212', border: '1px solid #242424', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid #242424', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={15} color="#D4AF37" />
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Active Events</h2>
              <span style={{ marginLeft: 'auto', background: '#242424', borderRadius: 20, padding: '2px 10px', fontSize: 12, color: '#8A8A8A' }}>
                {events.length} events
              </span>
            </div>
            <div style={{ maxHeight: 520, overflowY: 'auto', padding: '8px 0' }}>
              {events.map((ev, i) => {
                const cfg = EVENT_CONFIG[ev.type] ?? EVENT_CONFIG.CUSTOM;
                const Icon = cfg.icon;
                const title = ev.title || ev.query || (ev.url ? ev.url.split('/').filter(Boolean).pop() : 'Unknown');
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: '1px solid #0f0f0f' }}>
                    <div style={{ background: cfg.bg, borderRadius: 8, padding: 7, flexShrink: 0 }}>
                      <Icon size={14} color={cfg.color} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13, color: '#e5e7eb', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {title}
                      </div>
                      <div style={{ fontSize: 11, color: '#8A8A8A', marginTop: 2 }}>
                        {timeAgo(ev.timestamp)}
                      </div>
                    </div>
                    <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30`, borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Quick Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Events (24h)', value: stats.total, icon: Users, color: '#D4AF37' },
              { label: 'Movie Views', value: stats.movies, icon: Film, color: '#D4AF37' },
              { label: 'TV Views', value: stats.tv, icon: Tv, color: '#a78bfa' },
              { label: 'Searches', value: stats.searches, icon: Search, color: '#4ade80' },
            ].map((s) => (
              <div key={s.label} style={{ background: '#121212', border: '1px solid #242424', borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ background: `${s.color}18`, borderRadius: 10, padding: 10 }}>
                  <s.icon size={18} color={s.color} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#8A8A8A', marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{s.value.toLocaleString()}</div>
                </div>
              </div>
            ))}

            {stats.topContent.length > 0 && (
              <div style={{ background: '#121212', border: '1px solid #242424', borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ fontSize: 12, color: '#8A8A8A', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Content Today</div>
                {stats.topContent.map((title, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: i > 0 ? '1px solid #1a1a1a' : 'none' }}>
                    <span style={{ width: 20, height: 20, background: '#242424', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#D4AF37', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: 13, color: '#e5e7eb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ textAlign: 'right', fontSize: 12, color: '#8A8A8A', marginTop: 4 }}>
              Last refreshed: {secondsSince}s ago
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
        @keyframes liveBlip { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.5; transform:scale(1.4); } }
      `}</style>
    </div>
  );
}

import { Activity, Database, Globe, Server, RefreshCw, Loader2, CheckCircle, XCircle, AlertTriangle, MemoryStick } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { systemApi } from '../../services/api';

interface ServiceHealth {
  status: 'ok' | 'degraded' | 'error';
  latency?: number;
  error?: string;
}

interface MemoryInfo {
  heapUsed: number;
  heapTotal: number;
  rss: number;
}

interface HealthData {
  database?: ServiceHealth;
  tmdb?: ServiceHealth;
  publicSite?: ServiceHealth;
  memory?: MemoryInfo;
  uptime?: number;
  nodeVersion?: string;
  startedAt?: string;
}

function latencyColor(ms?: number, error?: boolean): string {
  if (error || ms === undefined) return '#f87171';
  if (ms < 100) return '#4ade80';
  if (ms < 500) return '#fbbf24';
  return '#f87171';
}

function latencyLabel(ms?: number, error?: boolean): { text: string; color: string; bg: string } {
  if (error) return { text: 'Error', color: '#f87171', bg: 'rgba(239,68,68,0.1)' };
  if (ms === undefined) return { text: 'Unknown', color: '#8A8A8A', bg: 'rgba(138,138,138,0.1)' };
  if (ms < 100) return { text: 'Healthy', color: '#4ade80', bg: 'rgba(74,222,128,0.1)' };
  if (ms < 500) return { text: 'Degraded', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' };
  return { text: 'Slow', color: '#f87171', bg: 'rgba(239,68,68,0.1)' };
}

function formatBytes(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function SystemHealthPage() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery<HealthData>({
    queryKey: ['system-health'],
    queryFn: () => systemApi.getHealth().then((r: any) => r.data.data),
    refetchInterval: 30000,
  });

  const memPct = data?.memory ? Math.round((data.memory.heapUsed / data.memory.heapTotal) * 100) : 0;
  const memColor = memPct < 50 ? '#4ade80' : memPct < 80 ? '#fbbf24' : '#f87171';

  const dbOk = data?.database?.status === 'ok';
  const tmdbOk = data?.tmdb?.status === 'ok';
  const siteOk = data?.publicSite?.status === 'ok';
  const anyError = !dbOk || !tmdbOk || !siteOk;
  const anyDegraded = (data?.database?.latency ?? 0) >= 100 || (data?.tmdb?.latency ?? 0) >= 100;

  let banner = { text: 'All Systems Operational', color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.3)', Icon: CheckCircle };
  if (isError) banner = { text: 'Unable to Reach Health Endpoint', color: '#f87171', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)', Icon: XCircle };
  else if (anyError) banner = { text: 'Service Disruption Detected', color: '#f87171', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)', Icon: XCircle };
  else if (anyDegraded) banner = { text: 'Degraded Performance', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.3)', Icon: AlertTriangle };

  const serviceCards = [
    {
      label: 'Database',
      Icon: Database,
      latency: data?.database?.latency,
      error: data?.database?.status === 'error',
      extra: data?.database?.latency !== undefined ? `${data.database.latency}ms` : '—',
    },
    {
      label: 'TMDB API',
      Icon: Globe,
      latency: data?.tmdb?.latency,
      error: data?.tmdb?.status === 'error',
      extra: data?.tmdb?.latency !== undefined ? `${data.tmdb.latency}ms` : '—',
    },
    {
      label: 'Public Website',
      Icon: Globe,
      latency: data?.publicSite?.latency,
      error: data?.publicSite?.status === 'error',
      extra: data?.publicSite?.latency !== undefined ? `${data.publicSite.latency}ms` : '—',
    },
    {
      label: 'API Server',
      Icon: Server,
      latency: 1,
      error: false,
      extra: data?.uptime !== undefined ? `Up ${formatUptime(data.uptime)}` : 'Running',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#070707', padding: '32px 24px', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#1a1a1a', border: '1px solid #242424', borderRadius: 10, padding: 10 }}>
            <Activity size={22} color="#D4AF37" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff' }}>System Health</h1>
            <p style={{ margin: 0, fontSize: 13, color: '#8A8A8A' }}>Auto-refreshes every 30s</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#121212', border: '1px solid #242424', borderRadius: 8, padding: '9px 16px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
        >
          {isFetching ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>

      {/* Status Banner */}
      {!isLoading && (
        <div style={{ background: banner.bg, border: `1px solid ${banner.border}`, borderRadius: 10, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
          <banner.Icon size={18} color={banner.color} />
          <span style={{ color: banner.color, fontWeight: 600, fontSize: 14 }}>{banner.text}</span>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ background: '#121212', border: '1px solid #242424', borderRadius: 12, padding: 24, animation: 'pulse 1.5s infinite' }}>
                <div style={{ height: 16, background: '#242424', borderRadius: 4, marginBottom: 14, width: '55%' }} />
                <div style={{ height: 28, background: '#242424', borderRadius: 4, width: '35%' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A8A8A', padding: 24, gap: 10 }}>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            Checking services…
          </div>
        </div>
      )}

      {!isLoading && (
        <>
          {/* Service Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            {serviceCards.map((svc) => {
              const color = latencyColor(svc.latency, svc.error);
              const lbl = latencyLabel(svc.latency, svc.error);
              return (
                <div key={svc.label} style={{ background: '#121212', border: '1px solid #242424', borderRadius: 12, padding: 22, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: color, borderRadius: '12px 0 0 12px' }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svc.Icon size={16} color={color} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb' }}>{svc.label}</span>
                    </div>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, display: 'block', boxShadow: `0 0 6px ${color}80` }} />
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{svc.extra}</div>
                  <span style={{ background: lbl.bg, color: lbl.color, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                    {lbl.text}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Server Resources */}
          {data?.memory && (
            <div style={{ background: '#121212', border: '1px solid #242424', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #242424', display: 'flex', alignItems: 'center', gap: 8 }}>
                <MemoryStick size={15} color="#D4AF37" />
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Server Resources</h2>
              </div>
              <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
                {/* Memory Usage */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#8A8A8A' }}>Heap Memory Usage</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: memColor }}>{memPct}%</span>
                  </div>
                  <div style={{ background: '#242424', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${memPct}%`, background: memColor, borderRadius: 99, transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                    <span style={{ fontSize: 11, color: '#8A8A8A' }}>{formatBytes(data.memory!.heapUsed)} used</span>
                    <span style={{ fontSize: 11, color: '#8A8A8A' }}>{formatBytes(data.memory!.heapTotal)} total</span>
                  </div>
                </div>

                {/* RSS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>RSS Memory</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{formatBytes(data.memory!.rss)}</span>
                </div>

                {/* Uptime */}
                {data.uptime !== undefined && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 12, color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Node.js Uptime</span>
                    <span style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{formatUptime(data.uptime)}</span>
                  </div>
                )}

                {/* Node version */}
                {data.nodeVersion && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 12, color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Node.js Version</span>
                    <span style={{ fontSize: 22, fontWeight: 700, color: '#4ade80' }}>{data.nodeVersion}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
      `}</style>
    </div>
  );
}

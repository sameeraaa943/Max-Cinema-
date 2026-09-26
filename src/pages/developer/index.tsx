import { useState } from 'react';
import { Code2, Play, Copy, ChevronDown, ChevronRight, Loader2, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../services/api';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface Endpoint {
  method: Method;
  path: string;
  description: string;
  requiresAuth: boolean;
}

interface EndpointGroup {
  section: string;
  endpoints: Endpoint[];
}

const METHOD_COLORS: Record<Method, { color: string; bg: string }> = {
  GET:    { color: '#4ade80', bg: 'rgba(74,222,128,0.15)'   },
  POST:   { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)'   },
  PUT:    { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)'   },
  DELETE: { color: '#f87171', bg: 'rgba(239,68,68,0.15)'    },
  PATCH:  { color: '#fb923c', bg: 'rgba(251,146,60,0.15)'   },
};

const ENDPOINT_GROUPS: EndpointGroup[] = [
  {
    section: 'System',
    endpoints: [
      { method: 'GET', path: '/health', description: 'API health check — returns uptime, version, and service status.', requiresAuth: false },
    ],
  },
  {
    section: 'Auth',
    endpoints: [
      { method: 'GET', path: '/api/auth/me', description: 'Returns the currently authenticated admin user profile.', requiresAuth: true },
    ],
  },
  {
    section: 'Movies',
    endpoints: [
      { method: 'GET', path: '/api/admin/movies', description: 'List all movies in the database with pagination support.', requiresAuth: true },
    ],
  },
  {
    section: 'TV Shows',
    endpoints: [
      { method: 'GET', path: '/api/admin/tv-shows', description: 'List all TV shows with season/episode counts.', requiresAuth: true },
    ],
  },
  {
    section: 'Featured',
    endpoints: [
      { method: 'GET', path: '/api/admin/featured', description: 'Get currently featured content slots for the homepage hero.', requiresAuth: true },
    ],
  },
  {
    section: 'Trending',
    endpoints: [
      { method: 'GET', path: '/api/admin/trending', description: 'Retrieve trending movies and TV shows ordered by popularity.', requiresAuth: true },
    ],
  },
  {
    section: 'Collections',
    endpoints: [
      { method: 'GET', path: '/api/admin/collections', description: 'List all curated content collections.', requiresAuth: true },
    ],
  },
  {
    section: 'Homepage',
    endpoints: [
      { method: 'GET', path: '/api/admin/homepage', description: 'Get homepage builder sections, ordering, and visibility state.', requiresAuth: true },
    ],
  },
  {
    section: 'Analytics',
    endpoints: [
      { method: 'GET', path: '/api/admin/analytics', description: 'Dashboard analytics summary — views, searches, top content.', requiresAuth: true },
      { method: 'GET', path: '/api/admin/analytics/live', description: 'Real-time event stream — last 40 visitor events.', requiresAuth: true },
      { method: 'GET', path: '/api/admin/analytics/searches', description: 'Search analytics with top queries and zero-result data.', requiresAuth: true },
    ],
  },
  {
    section: 'Content Center',
    endpoints: [
      { method: 'GET', path: '/api/admin/content-center/health', description: 'Content center pipeline health and queue status.', requiresAuth: true },
    ],
  },
  {
    section: 'Media',
    endpoints: [
      { method: 'GET', path: '/api/admin/media', description: 'List uploaded media assets (images, trailers).', requiresAuth: true },
    ],
  },
  {
    section: 'Scheduler',
    endpoints: [
      { method: 'GET', path: '/api/admin/scheduler', description: 'View scheduled jobs, their next run times and status.', requiresAuth: true },
    ],
  },
  {
    section: 'System Health',
    endpoints: [
      { method: 'GET', path: '/api/admin/system-health', description: 'Detailed system health — DB latency, TMDB ping, memory usage.', requiresAuth: true },
    ],
  },
];

function syntaxColor(raw: string): React.ReactNode[] {
  const lines = raw.split('\n');
  return lines.map((line, i) => {
    const colored = line
      .replace(/"([^"]+)"(\s*:)/g, '<span style="color:#60a5fa">"$1"</span>$2')
      .replace(/:\s*"([^"]+)"/g, ': <span style="color:#4ade80">"$1"</span>')
      .replace(/:\s*(\d+\.?\d*)/g, ': <span style="color:#fbbf24">$1</span>')
      .replace(/:\s*(true|false|null)/g, ': <span style="color:#f87171">$1</span>');
    return (
      <div key={i} dangerouslySetInnerHTML={{ __html: colored }} />
    );
  });
}

export default function DeveloperPage() {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Endpoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{ data: string; status: number; time: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const toggleSection = (section: string) => {
    setCollapsed((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const runRequest = async () => {
    if (!selected) return;
    setLoading(true);
    setResponse(null);
    const start = performance.now();
    try {
      const method = selected.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch';
      const res = await (api as any)[method](selected.path);
      const elapsed = Math.round(performance.now() - start);
      setResponse({ data: JSON.stringify(res.data, null, 2), status: res.status, time: elapsed });
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - start);
      const status = err?.response?.status ?? 0;
      const errData = err?.response?.data ?? { error: err?.message ?? 'Unknown error' };
      setResponse({ data: JSON.stringify(errData, null, 2), status, time: elapsed });
      toast.error(`Request failed: ${status || 'Network error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!response) return;
    navigator.clipboard.writeText(response.data).then(() => {
      setCopied(true);
      toast.success('Response copied!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const statusColor = (code: number) => {
    if (code >= 200 && code < 300) return { color: '#4ade80', bg: 'rgba(74,222,128,0.15)' };
    return { color: '#f87171', bg: 'rgba(239,68,68,0.15)' };
  };

  return (
    <div style={{ minHeight: '100vh', background: '#070707', padding: '32px 24px', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ background: '#1a1a1a', border: '1px solid #242424', borderRadius: 10, padding: 10 }}>
          <Code2 size={22} color="#D4AF37" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff' }}>API Console</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#8A8A8A' }}>Explore and test the CineScope API</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, alignItems: 'start', minHeight: 'calc(100vh - 160px)' }}>
        {/* LEFT: Endpoint List */}
        <div style={{ background: '#121212', border: '1px solid #242424', borderRadius: 12, overflow: 'hidden', position: 'sticky', top: 24 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #242424', fontSize: 12, fontWeight: 600, color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Endpoints
          </div>
          <div style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
            {ENDPOINT_GROUPS.map((group) => {
              const isOpen = !collapsed[group.section];
              return (
                <div key={group.section}>
                  <button
                    onClick={() => toggleSection(group.section)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', background: 'transparent', border: 'none', borderBottom: '1px solid #1a1a1a', cursor: 'pointer', color: '#e5e7eb', fontSize: 13, fontWeight: 600 }}
                  >
                    <span>{group.section}</span>
                    {isOpen ? <ChevronDown size={14} color="#8A8A8A" /> : <ChevronRight size={14} color="#8A8A8A" />}
                  </button>
                  {isOpen && group.endpoints.map((ep) => {
                    const mc = METHOD_COLORS[ep.method];
                    const isActive = selected?.path === ep.path && selected?.method === ep.method;
                    return (
                      <button
                        key={`${ep.method}:${ep.path}`}
                        onClick={() => { setSelected(ep); setResponse(null); }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px 10px 28px',
                          background: isActive ? 'rgba(212,175,55,0.08)' : 'transparent',
                          border: 'none', borderBottom: '1px solid #111', borderLeft: isActive ? '2px solid #D4AF37' : '2px solid transparent',
                          cursor: 'pointer', textAlign: 'left',
                        }}
                      >
                        <span style={{ background: mc.bg, color: mc.color, borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700, fontFamily: 'monospace', minWidth: 42, textAlign: 'center', flexShrink: 0 }}>
                          {ep.method}
                        </span>
                        <span style={{ fontSize: 12, color: isActive ? '#D4AF37' : '#9ca3af', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ep.path}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Request / Response */}
        <div style={{ background: '#121212', border: '1px solid #242424', borderRadius: 12, overflow: 'hidden', minHeight: 500 }}>
          {!selected ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80, color: '#8A8A8A', textAlign: 'center', gap: 12 }}>
              <Code2 size={36} color="#242424" />
              <p style={{ margin: 0, fontSize: 14 }}>Select an endpoint from the left to run a request</p>
            </div>
          ) : (
            <>
              {/* Endpoint header */}
              <div style={{ padding: '18px 22px', borderBottom: '1px solid #242424', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ background: METHOD_COLORS[selected.method].bg, color: METHOD_COLORS[selected.method].color, borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>
                  {selected.method}
                </span>
                <code style={{ fontSize: 14, color: '#e5e7eb', fontFamily: 'monospace' }}>{selected.path}</code>
                {selected.requiresAuth && (
                  <span style={{ marginLeft: 'auto', background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
                    🔐 Auth required
                  </span>
                )}
              </div>

              <div style={{ padding: '18px 22px' }}>
                <p style={{ margin: '0 0 18px', fontSize: 13, color: '#9ca3af', lineHeight: 1.6 }}>{selected.description}</p>

                {/* Run button */}
                <button
                  onClick={runRequest}
                  disabled={loading}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#D4AF37', border: 'none', borderRadius: 8, padding: '10px 22px', color: '#000', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginBottom: 20 }}
                >
                  {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={15} />}
                  {loading ? 'Running…' : 'Run Request'}
                </button>

                {/* Response */}
                {response && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <span style={{ background: statusColor(response.status).bg, color: statusColor(response.status).color, borderRadius: 6, padding: '3px 12px', fontSize: 13, fontWeight: 700 }}>
                        {response.status}
                      </span>
                      <span style={{ fontSize: 12, color: '#8A8A8A' }}>{response.time}ms</span>
                      <button
                        onClick={handleCopy}
                        style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: '#1a1a1a', border: '1px solid #242424', borderRadius: 6, padding: '5px 12px', color: copied ? '#4ade80' : '#8A8A8A', cursor: 'pointer', fontSize: 12 }}
                      >
                        {copied ? <CheckCheck size={12} /> : <Copy size={12} />}
                        {copied ? 'Copied!' : 'Copy Response'}
                      </button>
                    </div>
                    <div style={{ background: '#0a0a0a', border: '1px solid #242424', borderRadius: 10, padding: 18, fontFamily: 'monospace', fontSize: 12, lineHeight: 1.7, color: '#d1d5db', maxHeight: 480, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {syntaxColor(response.data)}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

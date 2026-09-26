import { useState } from 'react';
import { Search, TrendingUp, AlertCircle, BarChart2, Loader2, Copy, CheckCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { searchAnalyticsApi } from '../../services/api';

type Period = '7d' | '30d' | '90d';

interface SearchEntry {
  query: string;
  count: number;
  hasResults: boolean;
}

interface SearchAnalyticsData {
  totalSearches: number;
  uniqueQueries: number;
  zeroResultsCount: number;
  topSearches: SearchEntry[];
  zeroResultQueries: string[];
}

const TRACKER_SCRIPT = `<!-- CineScope Tracker -->
<script>
  (function() {
    var base = 'https://your-api-domain.com';
    function track(type, data) {
      fetch(base + '/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...data, url: location.href })
      }).catch(function() {});
    }
    window.csTrack = track;
    track('PAGE_VIEW', {});
  })();
</script>`;

export default function SearchAnalyticsPage() {
  const [period, setPeriod] = useState<Period>('7d');
  const [copied, setCopied] = useState(false);

  const { data, isLoading, isError } = useQuery<SearchAnalyticsData>({
    queryKey: ['search-analytics', period],
    queryFn: () => searchAnalyticsApi.getSearches(period).then((r: any) => r.data.data),
    refetchInterval: 300000,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(TRACKER_SCRIPT).then(() => {
      setCopied(true);
      toast.success('Tracker script copied!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const statCards = [
    { label: 'Total Searches', value: data?.totalSearches ?? 0, icon: Search, color: '#D4AF37' },
    { label: 'Unique Queries', value: data?.uniqueQueries ?? 0, icon: BarChart2, color: '#60a5fa' },
    { label: 'Zero Results', value: data?.zeroResultsCount ?? 0, icon: AlertCircle, color: '#f87171' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#070707', padding: '32px 24px', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#1a1a1a', border: '1px solid #242424', borderRadius: 10, padding: 10 }}>
            <Search size={22} color="#D4AF37" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff' }}>Search Analytics</h1>
            <p style={{ margin: 0, fontSize: 13, color: '#8A8A8A' }}>Track what visitors are searching for</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, background: '#121212', border: '1px solid #242424', borderRadius: 8, padding: 4 }}>
          {(['7d', '30d', '90d'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: period === p ? '#D4AF37' : 'transparent',
                color: period === p ? '#000' : '#8A8A8A',
                transition: 'all 0.15s',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ background: '#121212', border: '1px solid #242424', borderRadius: 12, padding: 24, animation: 'pulse 1.5s infinite' }}>
                <div style={{ height: 16, background: '#242424', borderRadius: 4, marginBottom: 12, width: '60%' }} />
                <div style={{ height: 32, background: '#242424', borderRadius: 4, width: '40%' }} />
              </div>
            ))}
          </div>
          <div style={{ background: '#121212', border: '1px solid #242424', borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#8A8A8A', padding: 40 }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Loading analytics data…</span>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <div style={{ background: '#1a0a0a', border: '1px solid #7f1d1d', borderRadius: 12, padding: 24, textAlign: 'center', color: '#f87171' }}>
          <AlertCircle size={32} style={{ marginBottom: 8 }} />
          <p style={{ margin: 0 }}>Failed to load analytics data. Please try again.</p>
        </div>
      )}

      {/* Data */}
      {!isLoading && !isError && data && (
        <>
          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            {statCards.map((card) => (
              <div key={card.label} style={{ background: '#121212', border: '1px solid #242424', borderRadius: 12, padding: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <card.icon size={18} color={card.color} />
                  <span style={{ fontSize: 13, color: '#8A8A8A', fontWeight: 500 }}>{card.label}</span>
                </div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#fff' }}>{card.value.toLocaleString()}</div>
              </div>
            ))}
          </div>

          {/* Top Searches Table */}
          <div style={{ background: '#121212', border: '1px solid #242424', borderRadius: 12, marginBottom: 24, overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #242424', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} color="#D4AF37" />
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#fff' }}>Top Searches</h2>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#8A8A8A' }}>Last {period}</span>
            </div>
            {data.topSearches && data.topSearches.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: '#0d0d0d' }}>
                      {['#', 'Query', 'Count', 'Has Results'].map((h) => (
                        <th key={h} style={{ padding: '12px 20px', textAlign: 'left', color: '#8A8A8A', fontWeight: 500, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.topSearches.map((row, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderTop: '1px solid #1a1a1a',
                          background: !row.hasResults ? 'rgba(239,68,68,0.05)' : 'transparent',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = !row.hasResults ? 'rgba(239,68,68,0.1)' : '#0f0f0f'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = !row.hasResults ? 'rgba(239,68,68,0.05)' : 'transparent'; }}
                      >
                        <td style={{ padding: '13px 20px', color: '#8A8A8A', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '13px 20px', color: '#fff', fontWeight: 500 }}>
                          {row.query}
                        </td>
                        <td style={{ padding: '13px 20px', color: '#D4AF37', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                          {row.count.toLocaleString()}
                        </td>
                        <td style={{ padding: '13px 20px' }}>
                          {row.hasResults ? (
                            <span style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                              ✓ Yes
                            </span>
                          ) : (
                            <span style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                              ✗ No
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: '#8A8A8A' }}>No search data for this period.</div>
            )}
          </div>

          {/* Zero-Result Queries */}
          {data.zeroResultQueries && data.zeroResultQueries.length > 0 && (
            <div style={{ background: '#121212', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #242424', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(251,191,36,0.05)' }}>
                <AlertCircle size={16} color="#fbbf24" />
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#fbbf24' }}>Zero-Result Queries</h2>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#8A8A8A' }}>{data.zeroResultQueries.length} queries</span>
              </div>
              <div style={{ padding: '16px 24px' }}>
                <p style={{ margin: '0 0 14px', fontSize: 13, color: '#8A8A8A' }}>
                  💡 <strong style={{ color: '#fbbf24' }}>Suggestion:</strong> Consider adding content for these searches — users are looking for content that doesn't exist yet.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {data.zeroResultQueries.map((q, i) => (
                    <span key={i} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', borderRadius: 6, padding: '5px 12px', fontSize: 13 }}>
                      {q}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!isLoading && !isError && !data && (
        <div style={{ background: '#121212', border: '1px solid #242424', borderRadius: 12, padding: 40, textAlign: 'center' }}>
          <Search size={40} color="#8A8A8A" style={{ marginBottom: 16 }} />
          <h3 style={{ margin: '0 0 8px', color: '#fff', fontSize: 18 }}>No search data yet</h3>
          <p style={{ margin: '0 0 24px', color: '#8A8A8A', fontSize: 14 }}>
            Add the tracker script to your public website to start capturing searches.
          </p>
          <div style={{ background: '#0a0a0a', border: '1px solid #242424', borderRadius: 10, padding: 20, textAlign: 'left', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: '#8A8A8A', fontFamily: 'monospace' }}>tracker.html</span>
              <button
                onClick={handleCopy}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1a1a1a', border: '1px solid #242424', borderRadius: 6, padding: '5px 12px', color: copied ? '#4ade80' : '#8A8A8A', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}
              >
                {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, color: '#d1d5db', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {TRACKER_SCRIPT}
            </pre>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
      `}</style>
    </div>
  );
}

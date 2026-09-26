import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ShieldCheck,
  AlertTriangle,
  Film,
  Tv,
  Image,
  FileText,
  Star,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { contentCenterApi } from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
type IssueType =
  | 'All'
  | 'Missing Poster'
  | 'Missing Backdrop'
  | 'Missing Trailer'
  | 'Missing Description'
  | 'Missing Genres';

interface HealthData {
  healthScore: number;
  missingPosters: number;
  missingBackdrops: number;
  missingTrailers: number;
  missingDescriptions: number;
  missingGenres?: number;
}

interface ContentIssue {
  _id: string;
  title: string;
  type: 'Movie' | 'TV';
  issue: string;
  contentId: string;
}

interface IssuesResponse {
  data: ContentIssue[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const ISSUE_TABS: IssueType[] = [
  'All',
  'Missing Poster',
  'Missing Backdrop',
  'Missing Trailer',
  'Missing Description',
  'Missing Genres',
];

const scoreColor = (score: number) => {
  if (score > 80) return '#22c55e';
  if (score >= 50) return '#eab308';
  return '#ef4444';
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const shimmerStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, #121212 25%, #1a1a1a 50%, #121212 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
  borderRadius: 12,
};

const SkeletonCard = () => (
  <div style={{ ...shimmerStyle, height: 100, flex: '1 1 200px' }} />
);

// ─── Circular Progress ────────────────────────────────────────────────────────
const CircularProgress = ({ score }: { score: number }) => {
  const radius = 70;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const progress = circumference - (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <svg width={radius * 2} height={radius * 2} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={radius}
        cy={radius}
        r={normalizedRadius}
        fill="none"
        stroke="#242424"
        strokeWidth={stroke}
      />
      <circle
        cx={radius}
        cy={radius}
        r={normalizedRadius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={progress}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ContentCenter() {
  const [selectedTab, setSelectedTab] = useState<IssueType>('All');
  const [page, setPage] = useState(1);

  // Health summary
  const {
    data: health,
    isLoading: healthLoading,
  } = useQuery<HealthData>({
    queryKey: ['content-health'],
    queryFn: () => contentCenterApi.getHealth().then((r: any) => r.data.data),
    refetchInterval: 60000,
  });

  // Issues list
  const {
    data: issuesData,
    isLoading: issuesLoading,
  } = useQuery<IssuesResponse>({
    queryKey: ['content-issues', selectedTab, page],
    queryFn: () =>
      contentCenterApi
        .getIssues({
          type: selectedTab === 'All' ? undefined : selectedTab,
          page,
          limit: 10,
        })
        .then((r: any) => r.data.data),
    keepPreviousData: true,
  } as any);

  const score = health?.healthScore ?? 0;
  const allHealthy =
    health &&
    health.missingPosters === 0 &&
    health.missingBackdrops === 0 &&
    health.missingTrailers === 0 &&
    health.missingDescriptions === 0 &&
    (health.missingGenres ?? 0) === 0;

  const statCards = health
    ? [
        {
          label: 'Missing Posters',
          count: health.missingPosters,
          icon: <Image size={20} />,
        },
        {
          label: 'Missing Backdrops',
          count: health.missingBackdrops,
          icon: <Film size={20} />,
        },
        {
          label: 'Missing Trailers',
          count: health.missingTrailers,
          icon: <Star size={20} />,
        },
        {
          label: 'Missing Descriptions',
          count: health.missingDescriptions,
          icon: <FileText size={20} />,
        },
      ]
    : [];

  return (
    <div style={{ padding: '32px', minHeight: '100vh', background: '#070707', color: '#fff' }}>
      {/* Shimmer keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
        <div
          style={{
            background: 'rgba(212,175,55,0.12)',
            borderRadius: 12,
            padding: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ShieldCheck size={26} color="#D4AF37" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#fff' }}>
            Content Health
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: '#8A8A8A', marginTop: 2 }}>
            Monitor and fix content quality issues
          </p>
        </div>
      </div>

      {/* Skeletons while loading */}
      {healthLoading ? (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <>
          {/* Score + Stat Cards row */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              marginBottom: 32,
              alignItems: 'stretch',
            }}
          >
            {/* Health Score Card */}
            <div
              style={{
                background: '#121212',
                border: '1px solid #242424',
                borderRadius: 16,
                padding: '28px 36px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                minWidth: 200,
              }}
            >
              <div style={{ position: 'relative', width: 140, height: 140 }}>
                <CircularProgress score={score} />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: 32,
                      fontWeight: 800,
                      color: scoreColor(score),
                      lineHeight: 1,
                    }}
                  >
                    {score}
                  </span>
                  <span style={{ fontSize: 11, color: '#8A8A8A' }}>/ 100</span>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#fff' }}>
                  Content Health Score
                </div>
                <div style={{ fontSize: 12, color: '#8A8A8A', marginTop: 2 }}>
                  {score > 80 ? 'Excellent' : score >= 50 ? 'Needs attention' : 'Critical'}
                </div>
              </div>
            </div>

            {/* Stat Cards */}
            {statCards.map((card) => (
              <div
                key={card.label}
                style={{
                  background: '#121212',
                  border: '1px solid #242424',
                  borderRadius: 16,
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  flex: '1 1 180px',
                  minWidth: 160,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: card.count > 0 ? '#D4AF37' : '#22c55e',
                  }}
                >
                  {card.icon}
                  <span style={{ fontSize: 12, color: '#8A8A8A' }}>{card.label}</span>
                </div>
                <div
                  style={{
                    fontSize: 40,
                    fontWeight: 800,
                    color: card.count > 0 ? '#D4AF37' : '#22c55e',
                    lineHeight: 1,
                  }}
                >
                  {card.count}
                </div>
                <div style={{ fontSize: 12, color: '#8A8A8A' }}>
                  {card.count === 0 ? 'All good' : 'items need attention'}
                </div>
              </div>
            ))}
          </div>

          {/* All healthy state */}
          {allHealthy ? (
            <div
              style={{
                background: '#121212',
                border: '1px solid #242424',
                borderRadius: 16,
                padding: '60px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
              }}
            >
              <CheckCircle size={64} color="#22c55e" />
              <div style={{ fontSize: 22, fontWeight: 700, color: '#22c55e' }}>
                All content looks healthy!
              </div>
              <div style={{ fontSize: 14, color: '#8A8A8A' }}>
                No issues detected. Keep up the great work.
              </div>
            </div>
          ) : (
            /* Issues Breakdown */
            <div
              style={{
                background: '#121212',
                border: '1px solid #242424',
                borderRadius: 16,
                overflow: 'hidden',
              }}
            >
              {/* Section header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #242424' }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff' }}>
                  Issues Breakdown
                </h2>
              </div>

              {/* Tab bar */}
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  padding: '12px 24px',
                  borderBottom: '1px solid #242424',
                  overflowX: 'auto',
                }}
              >
                {ISSUE_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setSelectedTab(tab);
                      setPage(1);
                    }}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 8,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      background: selectedTab === tab ? '#D4AF37' : 'transparent',
                      color: selectedTab === tab ? '#070707' : '#8A8A8A',
                      transition: 'all 0.2s',
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Issues Table */}
              {issuesLoading ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 48,
                  }}
                >
                  <Loader2 size={32} color="#D4AF37" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : !issuesData?.data?.length ? (
                <div
                  style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    color: '#8A8A8A',
                    fontSize: 14,
                  }}
                >
                  No issues found for this category.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #242424' }}>
                        {['Title', 'Type', 'Issue', 'Actions'].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: '12px 24px',
                              textAlign: 'left',
                              fontSize: 12,
                              fontWeight: 600,
                              color: '#8A8A8A',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {issuesData.data.map((issue, idx) => (
                        <tr
                          key={issue._id ?? idx}
                          style={{
                            borderBottom: '1px solid #242424',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) =>
                            ((e.currentTarget as HTMLElement).style.background = '#1a1a1a')
                          }
                          onMouseLeave={(e) =>
                            ((e.currentTarget as HTMLElement).style.background = 'transparent')
                          }
                        >
                          <td style={{ padding: '14px 24px', fontSize: 14, color: '#fff' }}>
                            {issue.title}
                          </td>
                          <td style={{ padding: '14px 24px' }}>
                            <span
                              style={{
                                padding: '3px 10px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 600,
                                background:
                                  issue.type === 'Movie'
                                    ? 'rgba(99,102,241,0.18)'
                                    : 'rgba(20,184,166,0.18)',
                                color: issue.type === 'Movie' ? '#818cf8' : '#2dd4bf',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              {issue.type === 'Movie' ? (
                                <Film size={10} />
                              ) : (
                                <Tv size={10} />
                              )}
                              {issue.type}
                            </span>
                          </td>
                          <td style={{ padding: '14px 24px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: 13,
                                color: '#f97316',
                              }}
                            >
                              <AlertTriangle size={14} />
                              {issue.issue}
                            </span>
                          </td>
                          <td style={{ padding: '14px 24px' }}>
                            <Link
                              to={
                                issue.type === 'Movie'
                                  ? `/movies/${issue.contentId}/edit`
                                  : `/tv-shows/${issue.contentId}/edit`
                              }
                              style={{
                                padding: '6px 14px',
                                borderRadius: 8,
                                background: 'rgba(212,175,55,0.12)',
                                color: '#D4AF37',
                                textDecoration: 'none',
                                fontSize: 13,
                                fontWeight: 600,
                                border: '1px solid rgba(212,175,55,0.25)',
                                transition: 'background 0.2s',
                              }}
                            >
                              Fix
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {issuesData && issuesData.totalPages > 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 24px',
                    borderTop: '1px solid #242424',
                  }}
                >
                  <span style={{ fontSize: 13, color: '#8A8A8A' }}>
                    Page {issuesData.page} of {issuesData.totalPages} &nbsp;·&nbsp;{' '}
                    {issuesData.total} issues
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      style={{
                        padding: '6px 16px',
                        borderRadius: 8,
                        border: '1px solid #242424',
                        background: '#121212',
                        color: page === 1 ? '#8A8A8A' : '#fff',
                        cursor: page === 1 ? 'not-allowed' : 'pointer',
                        fontSize: 13,
                      }}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(issuesData.totalPages, p + 1))
                      }
                      disabled={page === issuesData.totalPages}
                      style={{
                        padding: '6px 16px',
                        borderRadius: 8,
                        border: '1px solid #242424',
                        background: '#121212',
                        color: page === issuesData.totalPages ? '#8A8A8A' : '#fff',
                        cursor:
                          page === issuesData.totalPages ? 'not-allowed' : 'pointer',
                        fontSize: 13,
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

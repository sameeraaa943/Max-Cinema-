import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ClipboardList,
  Shield,
  User,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
} from 'lucide-react';
import { auditApi } from '../../services/api';
import { AuditLog } from '../../types';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', { page, limit, action: actionFilter, resourceType: resourceFilter }],
    queryFn: () =>
      auditApi.list({
        page,
        limit,
        action: actionFilter || undefined,
        resourceType: resourceFilter || undefined,
      }),
  });

  const logs: (AuditLog & { adminName?: string })[] = data?.data?.data?.items || [];
  const total = data?.data?.data?.total || 0;
  const totalPages = data?.data?.data?.totalPages || 1;

  const getActionBadgeStyle = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('CREATE') || act.includes('ADD')) {
      return { backgroundColor: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' };
    }
    if (act.includes('UPDATE') || act.includes('REORDER')) {
      return { backgroundColor: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' };
    }
    if (act.includes('DELETE') || act.includes('REMOVE')) {
      return { backgroundColor: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' };
    }
    return { backgroundColor: 'rgba(212,175,55,0.12)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-cinzel tracking-wide flex items-center gap-2">
          <ClipboardList size={22} style={{ color: '#D4AF37' }} />
          <span>Audit & Security Logs</span>
        </h1>
        <p className="text-xs text-muted mt-1">
          Immutable ledger of all administrative CRUD events, publication changes, and system modifications
        </p>
      </div>

      {/* Filters */}
      <div
        className="rounded-xl p-4 flex flex-wrap items-center gap-3"
        style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
      >
        <select
          value={resourceFilter}
          onChange={(e) => { setResourceFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg text-xs focus:outline-none"
          style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
        >
          <option value="">All Resource Types</option>
          <option value="Movie">Movie</option>
          <option value="TVShow">TV Show</option>
          <option value="FeaturedItem">Featured Content</option>
          <option value="TrendingItem">Trending Content</option>
          <option value="Collection">Collection</option>
          <option value="HomepageConfig">Homepage Config</option>
          <option value="Advertisement">Advertisement</option>
          <option value="SiteSettings">Site Settings</option>
        </select>

        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg text-xs focus:outline-none"
          style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
        >
          <option value="">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="ADD_FEATURED">Add Featured</option>
          <option value="REMOVE_FEATURED">Remove Featured</option>
          <option value="ADD_TRENDING">Add Trending</option>
          <option value="REMOVE_TRENDING">Remove Trending</option>
        </select>
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
      >
        {isLoading ? (
          <div className="p-6">
            <LoadingSkeleton lines={6} height="40px" />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            title="No audit logs found"
            description="Administrative actions will appear in this ledger as you create and modify catalog items."
            icon={ClipboardList}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-semibold text-muted uppercase tracking-wider border-b border-[#242424]" style={{ backgroundColor: '#0D0D0D' }}>
                  <th className="py-3.5 px-4">Administrator</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Resource</th>
                  <th className="py-3.5 px-4">Resource ID</th>
                  <th className="py-3.5 px-4">IP Address</th>
                  <th className="py-3.5 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f1f] text-xs">
                {logs.map((log) => {
                  const style = getActionBadgeStyle(log.action);
                  const time = new Date(log.createdAt).toLocaleString();

                  return (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{log.adminName || 'Admin'}</div>
                        <span className="text-[10px] text-muted block">{log.adminEmail}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase"
                          style={style}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-semibold text-white">
                        {log.resourceType}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-muted truncate max-w-xs">
                        {log.resourceId || '—'}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-muted">
                        {log.ipAddress || 'unknown'}
                      </td>

                      <td className="py-3 px-4 text-right text-muted text-[11px] font-mono">
                        {time}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3 border-t border-[#242424] text-xs text-muted"
            style={{ backgroundColor: '#0D0D0D' }}
          >
            <span>Showing {logs.length} of {total} events</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded border border-[#242424] disabled:opacity-30 hover:text-white"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-mono">{page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded border border-[#242424] disabled:opacity-30 hover:text-white"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

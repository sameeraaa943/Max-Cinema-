import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Play,
  Trash2,
  RefreshCw,
  Clock,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { automationApi } from '../../services/api';

export default function AutomationCenterPage() {
  const queryClient = useQueryClient();
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Sync Form State
  const [syncType, setSyncType] = useState('MOVIE');
  const [syncCategory, setSyncCategory] = useState('POPULAR');
  const [syncPages, setSyncPages] = useState(1);

  // Fetch Rules & Runs
  const { data: rulesData, isLoading: rulesLoading } = useQuery({
    queryKey: ['automation-rules'],
    queryFn: () => automationApi.getRules(),
  });

  const { data: runsData } = useQuery({
    queryKey: ['automation-runs'],
    queryFn: () => automationApi.getRuns(),
  });

  const rules = rulesData?.data?.data || [];
  const runs = runsData?.data?.data || [];

  // Trigger Rule Mutation
  const triggerMutation = useMutation({
    mutationFn: (id: string) => automationApi.triggerRule(id),
    onSuccess: () => {
      toast.success('Automation rule triggered');
      queryClient.invalidateQueries({ queryKey: ['automation-runs'] });
    },
    onError: () => toast.error('Failed to trigger automation'),
  });

  // Delete Rule Mutation
  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => automationApi.deleteRule(id),
    onSuccess: () => {
      toast.success('Rule removed');
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
    },
  });

  // TMDB Sync Runner Mutation
  const tmdbSyncMutation = useMutation({
    mutationFn: (params: any) => automationApi.tmdbSync(params),
    onSuccess: (res: any) => {
      toast.success(`TMDB Sync complete: ${res.data?.data?.syncedCount || 0} items processed`);
      queryClient.invalidateQueries({ queryKey: ['automation-runs'] });
      setIsSyncModalOpen(false);
    },
    onError: () => toast.error('TMDB Sync failed'),
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-cinzel tracking-wide">Automation Engine</h1>
          <p className="text-xs text-muted mt-1">
            Configure automated TMDB syncing, scheduled health sweeps, and auto-tagging workflows.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#161616] border border-[#2a2a2a] text-white hover:border-gold/50 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw size={14} className="text-gold" />
            <span>Run TMDB Importer</span>
          </button>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rulesLoading ? (
          <div className="col-span-full p-8 text-center text-xs text-muted">
            <Loader2 size={16} className="animate-spin text-gold mx-auto mb-2" />
            <span>Loading automation rules...</span>
          </div>
        ) : rules.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-[#121212] border border-[#242424] rounded-xl text-xs text-muted">
            No automation rules configured. Trigger a TMDB sync to initiate automated ingestion.
          </div>
        ) : (
          rules.map((rule: any) => (
            <div
              key={rule.id}
              className="p-4 rounded-xl bg-[#121212] border border-[#242424] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{rule.name}</span>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-semibold"
                    style={{
                      backgroundColor: rule.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(100,100,100,0.15)',
                      color: rule.isActive ? '#34d399' : '#888',
                    }}
                  >
                    {rule.isActive ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>
                <p className="text-[11px] text-muted mt-1.5">{rule.description || rule.event}</p>
                <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-gray-400">
                  <Clock size={11} />
                  <span>Cron: {rule.cronExpression || 'Every 12 hours'}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#202020] flex items-center justify-between">
                <button
                  onClick={() => triggerMutation.mutate(rule.id)}
                  disabled={triggerMutation.isPending}
                  className="px-3 py-1 rounded bg-gold/15 text-gold border border-gold/30 hover:bg-gold/25 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Play size={11} />
                  <span>Run Now</span>
                </button>
                <button
                  onClick={() => deleteRuleMutation.mutate(rule.id)}
                  className="p-1 rounded text-muted hover:text-red-400"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Execution Run Log */}
      <div
        className="p-5 rounded-2xl space-y-4"
        style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
      >
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Recent Automation Runs</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#242424] bg-[#0D0D0D] text-[11px] text-muted uppercase">
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Triggered At</th>
                <th className="py-3 px-4">Logs / Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e1e]">
              {runs.map((run: any) => (
                <tr key={run.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-semibold text-white">{run.ruleName || run.event || 'TMDB_SYNC'}</td>
                  <td className="py-3 px-4">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-semibold"
                      style={{
                        backgroundColor: run.status === 'SUCCESS' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: run.status === 'SUCCESS' ? '#34d399' : '#f87171',
                      }}
                    >
                      {run.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-muted">{run.durationMs ? `${run.durationMs}ms` : '—'}</td>
                  <td className="py-3 px-4 text-muted">{new Date(run.createdAt).toLocaleString()}</td>
                  <td className="py-3 px-4 text-muted font-mono text-[11px] max-w-xs truncate">{run.resultMessage || 'Execution completed normally'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TMDB Sync Modal */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl p-6 bg-[#121212] border border-[#242424]">
            <h2 className="text-lg font-bold text-white font-cinzel">Trigger TMDB Live Ingestion</h2>
            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-muted font-medium mb-1">Content Type</label>
                <select
                  value={syncType}
                  onChange={(e) => setSyncType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white focus:outline-none"
                >
                  <option value="MOVIE">Movies</option>
                  <option value="TV">TV Series</option>
                </select>
              </div>

              <div>
                <label className="block text-muted font-medium mb-1">Catalog Endpoint</label>
                <select
                  value={syncCategory}
                  onChange={(e) => setSyncCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white focus:outline-none"
                >
                  <option value="POPULAR">Popular</option>
                  <option value="TOP_RATED">Top Rated</option>
                  <option value="UPCOMING">Upcoming</option>
                  <option value="NOW_PLAYING">Now Playing</option>
                </select>
              </div>

              <div>
                <label className="block text-muted font-medium mb-1">Pages to Fetch (20 items/page)</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={syncPages}
                  onChange={(e) => setSyncPages(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white font-mono focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#242424]">
                <button
                  type="button"
                  onClick={() => setIsSyncModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={tmdbSyncMutation.isPending}
                  onClick={() => tmdbSyncMutation.mutate({ type: syncType, category: syncCategory, pages: syncPages })}
                  className="px-4 py-2 rounded-lg font-semibold btn-gold disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)', color: '#070707' }}
                >
                  {tmdbSyncMutation.isPending ? 'Syncing...' : 'Start Ingestion'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

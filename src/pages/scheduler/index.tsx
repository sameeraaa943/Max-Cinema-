// File: src/pages/scheduler/index.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Play, X, Trash2, Plus, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { schedulerApi } from '../../services/api';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';

type StatusFilter = 'ALL' | 'PENDING' | 'EXECUTED' | 'FAILED' | 'CANCELLED';

const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
  PUBLISH: { bg: '#052E16', text: '#4ADE80' },
  UNPUBLISH: { bg: '#1C1107', text: '#FB923C' },
  FEATURE: { bg: '#0C1A3A', text: '#60A5FA' },
  UNFEATURE: { bg: '#1A1A1A', text: '#9CA3AF' },
  SET_TRENDING: { bg: '#1A0B2E', text: '#A78BFA' },
  REMOVE_TRENDING: { bg: '#1A1A1A', text: '#6B7280' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  PENDING: { bg: '#1C1500', text: '#FBBF24', icon: <Clock size={12} /> },
  EXECUTED: { bg: '#052E16', text: '#4ADE80', icon: <CheckCircle size={12} /> },
  FAILED: { bg: '#2D0000', text: '#F87171', icon: <AlertCircle size={12} /> },
  CANCELLED: { bg: '#1A1A1A', text: '#6B7280', icon: <X size={12} /> },
};

interface ScheduledTask {
  id: string; action: string; status: string; scheduledAt: string;
  executedAt?: string; notes?: string; error?: string;
  targetType: string; targetId: string; targetTitle?: string;
}

interface CreateForm {
  targetType: string; targetId: string; action: string;
  scheduledAt: string; notes: string;
}

export default function SchedulerPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateForm>({
    targetType: 'MOVIE', targetId: '', action: 'PUBLISH', scheduledAt: '', notes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['scheduler', statusFilter],
    queryFn: () => schedulerApi.list({ status: statusFilter === 'ALL' ? undefined : statusFilter }).then(r => r.data),
    refetchInterval: 30000,
  });

  const tasks: ScheduledTask[] = data?.data?.items || data?.data || [];

  const createMutation = useMutation({
    mutationFn: () => schedulerApi.create({ ...form }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler'] });
      toast.success('Task scheduled');
      setShowCreateModal(false);
      setForm({ targetType: 'MOVIE', targetId: '', action: 'PUBLISH', scheduledAt: '', notes: '' });
    },
    onError: () => toast.error('Failed to schedule task'),
  });

  const executeMutation = useMutation({
    mutationFn: (id: string) => schedulerApi.executeNow(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['scheduler'] }); toast.success('Task executed'); },
    onError: () => toast.error('Execution failed'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => schedulerApi.cancel(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['scheduler'] }); toast.success('Task cancelled'); },
    onError: () => toast.error('Cancel failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => schedulerApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['scheduler'] }); toast.success('Task deleted'); setDeleteId(null); },
    onError: () => toast.error('Delete failed'),
  });

  const formatDate = (d: string) => new Date(d).toLocaleString();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-cinzel tracking-wide flex items-center gap-2">
            <CalendarClock size={22} style={{ color: '#D4AF37' }} /> Content Scheduler
          </h1>
          <p className="text-xs mt-1" style={{ color: '#8A8A8A' }}>Automate content publishing, featuring, and trending</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold self-start"
          style={{ background: 'linear-gradient(135deg, #D4AF37, #C5A028)', color: '#070707' }}>
          <Plus size={15} /> Schedule Task
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 flex-wrap">
        {(['ALL', 'PENDING', 'EXECUTED', 'FAILED', 'CANCELLED'] as StatusFilter[]).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ backgroundColor: statusFilter === s ? '#D4AF37' : '#1A1A1A', color: statusFilter === s ? '#070707' : '#8A8A8A', border: '1px solid #242424' }}>
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#121212', border: '1px solid #242424' }}>
        {isLoading ? (
          <div className="p-6"><LoadingSkeleton lines={5} height="44px" /></div>
        ) : tasks.length === 0 ? (
          <EmptyState title="No scheduled tasks" description="Click Schedule Task to automate content publishing." icon={CalendarClock} action={{ label: 'Schedule Task', onClick: () => setShowCreateModal(true) }} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[11px] font-semibold uppercase tracking-wider border-b" style={{ backgroundColor: '#0D0D0D', color: '#8A8A8A', borderColor: '#242424' }}>
                  <th className="py-3 px-4">Target</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Scheduled At</th>
                  <th className="py-3 px-4">Executed At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#1F1F1F' }}>
                {tasks.map(task => {
                  const sc = STATUS_COLORS[task.status] || STATUS_COLORS.CANCELLED;
                  const ac = ACTION_COLORS[task.action] || { bg: '#1A1A1A', text: '#9CA3AF' };
                  return (
                    <tr key={task.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4">
                        <div style={{ color: '#CCC' }}>{task.targetTitle || task.targetId}</div>
                        <div style={{ color: '#8A8A8A', fontSize: 10 }}>{task.targetType}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: ac.bg, color: ac.text }}>{task.action}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium w-fit" style={{ backgroundColor: sc.bg, color: sc.text }}>
                          {sc.icon} {task.status}
                        </span>
                        {task.error && <div className="text-[10px] mt-0.5 truncate max-w-32" style={{ color: '#F87171' }}>{task.error}</div>}
                      </td>
                      <td className="py-3 px-4" style={{ color: '#8A8A8A' }}>{formatDate(task.scheduledAt)}</td>
                      <td className="py-3 px-4" style={{ color: '#8A8A8A' }}>{task.executedAt ? formatDate(task.executedAt) : '—'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          {task.status === 'PENDING' && (
                            <>
                              <button onClick={() => executeMutation.mutate(task.id)} disabled={executeMutation.isPending}
                                className="p-1.5 rounded" style={{ backgroundColor: '#052E16', color: '#4ADE80' }} title="Execute now">
                                {executeMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                              </button>
                              <button onClick={() => cancelMutation.mutate(task.id)} disabled={cancelMutation.isPending}
                                className="p-1.5 rounded" style={{ backgroundColor: '#1C1500', color: '#FBBF24' }} title="Cancel">
                                <X size={12} />
                              </button>
                            </>
                          )}
                          <button onClick={() => setDeleteId(task.id)} className="p-1.5 rounded" style={{ backgroundColor: '#2D0000', color: '#F87171' }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }} onClick={() => setShowCreateModal(false)}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ backgroundColor: '#121212', border: '1px solid #242424' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Schedule Task</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ color: '#8A8A8A' }}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#8A8A8A' }}>Target Type</label>
                <select value={form.targetType} onChange={e => setForm(p => ({ ...p, targetType: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none" style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFF' }}>
                  <option>MOVIE</option><option>TV_SHOW</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#8A8A8A' }}>Action</label>
                <select value={form.action} onChange={e => setForm(p => ({ ...p, action: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none" style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFF' }}>
                  {['PUBLISH','UNPUBLISH','FEATURE','UNFEATURE','SET_TRENDING','REMOVE_TRENDING'].map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#8A8A8A' }}>Content ID *</label>
              <input type="text" placeholder="e.g. cm8abc123..." value={form.targetId} onChange={e => setForm(p => ({ ...p, targetId: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none" style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFF' }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#8A8A8A' }}>Scheduled At *</label>
              <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none" style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFF' }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#8A8A8A' }}>Notes (optional)</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none resize-none" style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFF' }} />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-lg text-xs" style={{ backgroundColor: '#1A1A1A', border: '1px solid #242424', color: '#8A8A8A' }}>Cancel</button>
              <button onClick={() => createMutation.mutate()} disabled={!form.targetId || !form.scheduledAt || createMutation.isPending}
                className="px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #D4AF37, #C5A028)', color: '#070707' }}>
                {createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CalendarClock size={14} />} Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Task"
        message="Delete this scheduled task permanently?"
        confirmLabel="Delete Task"
        danger
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

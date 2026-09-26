// File: src/pages/scheduler/index.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Play, X, Trash2, Plus, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { schedulerApi } from '../../services/api';

const cardStyle: React.CSSProperties = { background: '#121212', border: '1px solid #242424', borderRadius: 12 };
const btnGold: React.CSSProperties = {
  background: 'linear-gradient(135deg, #D4AF37, #C5A028)', color: '#070707', border: 'none',
  borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
};
const btnGhost: React.CSSProperties = {
  background: 'transparent', color: '#8A8A8A', border: '1px solid #242424',
  borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
};
const inputStyle: React.CSSProperties = {
  background: '#121212', border: '1px solid #242424', borderRadius: 8, color: '#fff',
  padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%',
};

const STATUS_TABS = ['ALL', 'PENDING', 'EXECUTED', 'FAILED', 'CANCELLED'];

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  PENDING:   { bg: 'rgba(234,179,8,0.15)',   color: '#eab308' },
  EXECUTED:  { bg: 'rgba(34,197,94,0.15)',   color: '#22c55e' },
  FAILED:    { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444' },
  CANCELLED: { bg: 'rgba(107,114,128,0.15)', color: '#6b7280' },
};

const ACTION_STYLES: Record<string, { bg: string; color: string }> = {
  PUBLISH:         { bg: 'rgba(34,197,94,0.15)',   color: '#22c55e' },
  UNPUBLISH:       { bg: 'rgba(249,115,22,0.15)',  color: '#f97316' },
  FEATURE:         { bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6' },
  UNFEATURE:       { bg: 'rgba(107,114,128,0.15)', color: '#6b7280' },
  SET_TRENDING:    { bg: 'rgba(168,85,247,0.15)',  color: '#a855f7' },
  REMOVE_TRENDING: { bg: 'rgba(107,114,128,0.15)', color: '#8A8A8A' },
};

const ACTIONS = ['PUBLISH', 'UNPUBLISH', 'FEATURE', 'UNFEATURE', 'SET_TRENDING', 'REMOVE_TRENDING'];

function formatDate(str: string) {
  if (!str) return '—';
  return new Date(str).toLocaleString();
}

export default function SchedulerPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ targetType: 'MOVIE', targetId: '', action: 'PUBLISH', scheduledAt: '', notes: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['scheduler', statusFilter],
    queryFn: () => schedulerApi.list({ status: statusFilter === 'ALL' ? undefined : statusFilter }).then(r => r.data),
    refetchInterval: 30000,
  });

  const executeMutation = useMutation({
    mutationFn: (id: string) => schedulerApi.executeNow(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['scheduler'] }); toast.success('Task executed'); },
    onError: () => toast.error('Failed to execute task'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => schedulerApi.cancel(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['scheduler'] }); toast.success('Task cancelled'); },
    onError: () => toast.error('Failed to cancel task'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => schedulerApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['scheduler'] }); setDeleteId(null); toast.success('Task deleted'); },
    onError: () => toast.error('Failed to delete task'),
  });

  const createMutation = useMutation({
    mutationFn: () => schedulerApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['scheduler'] }); toast.success('Task scheduled'); setShowModal(false); setForm({ targetType: 'MOVIE', targetId: '', action: 'PUBLISH', scheduledAt: '', notes: '' }); },
    onError: () => toast.error('Failed to schedule task'),
  });

  const tasks: any[] = data?.data || [];

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <CalendarClock size={28} color="#D4AF37" />
          <div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, fontFamily: 'Cinzel, serif' }}>Content Scheduler</h1>
            <p style={{ color: '#8A8A8A', fontSize: 13, marginTop: 2 }}>Schedule content publishing, featuring and trending</p>
          </div>
        </div>
        <button style={btnGold} onClick={() => setShowModal(true)}>
          <Plus size={16} /> Schedule Task
        </button>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {STATUS_TABS.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{
            background: statusFilter === s ? '#D4AF37' : '#121212',
            color: statusFilter === s ? '#070707' : '#8A8A8A',
            border: '1px solid #242424', borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 600,
          }}>{s}</button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
          <Loader2 size={32} color="#D4AF37" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && tasks.length === 0 && (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Clock size={48} color="#242424" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: '#8A8A8A' }}>No scheduled tasks for status: {statusFilter}</p>
        </div>
      )}

      {/* Table */}
      {!isLoading && tasks.length > 0 && (
        <div style={cardStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #242424' }}>
                {['Target', 'Action', 'Status', 'Scheduled At', 'Executed At', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#8A8A8A', fontSize: 12, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task: any) => {
                const statusStyle = STATUS_STYLES[task.status] || { bg: '#1a1a1a', color: '#8A8A8A' };
                const actionStyle = ACTION_STYLES[task.action] || { bg: '#1a1a1a', color: '#8A8A8A' };
                return (
                  <tr key={task.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '12px 16px', color: '#fff', fontSize: 13 }}>
                      <div>{task.movie?.title || task.tvShow?.title || task.targetId}</div>
                      <div style={{ color: '#8A8A8A', fontSize: 11 }}>{task.targetType}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: actionStyle.bg, color: actionStyle.color, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{task.action}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: statusStyle.bg, color: statusStyle.color, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {task.status === 'EXECUTED' && <CheckCircle size={10} />}
                        {task.status === 'FAILED' && <AlertCircle size={10} />}
                        {task.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#8A8A8A', fontSize: 12 }}>{formatDate(task.scheduledAt)}</td>
                    <td style={{ padding: '12px 16px', color: '#8A8A8A', fontSize: 12 }}>{task.executedAt ? formatDate(task.executedAt) : '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {task.status === 'PENDING' && (
                          <>
                            <button onClick={() => executeMutation.mutate(task.id)} title="Execute Now" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                              <Play size={10} /> Run
                            </button>
                            <button onClick={() => cancelMutation.mutate(task.id)} title="Cancel" style={{ ...btnGhost, padding: '4px 8px', fontSize: 11 }}>
                              <X size={10} />
                            </button>
                          </>
                        )}
                        <button onClick={() => setDeleteId(task.id)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}>
                          <Trash2 size={10} />
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

      {/* Delete confirm */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ ...cardStyle, padding: 28, maxWidth: 420, width: '90%' }}>
            <h3 style={{ color: '#fff', marginBottom: 12 }}>Delete Task?</h3>
            <p style={{ color: '#8A8A8A', fontSize: 14, marginBottom: 24 }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteId(null)} style={{ ...btnGhost, flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button onClick={() => deleteMutation.mutate(deleteId)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer', flex: 1 }}>
                {deleteMutation.isPending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ ...cardStyle, width: '100%', maxWidth: 480, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>Schedule Task</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#8A8A8A', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ color: '#8A8A8A', fontSize: 12, display: 'block', marginBottom: 4 }}>Target Type</label>
                <select style={{ ...inputStyle }} value={form.targetType} onChange={e => setForm(f => ({ ...f, targetType: e.target.value }))}>
                  <option value="MOVIE">Movie</option>
                  <option value="TV_SHOW">TV Show</option>
                </select>
              </div>
              <div>
                <label style={{ color: '#8A8A8A', fontSize: 12, display: 'block', marginBottom: 4 }}>Content ID *</label>
                <input style={inputStyle} placeholder="Enter movie or TV show ID" value={form.targetId} onChange={e => setForm(f => ({ ...f, targetId: e.target.value }))} />
              </div>
              <div>
                <label style={{ color: '#8A8A8A', fontSize: 12, display: 'block', marginBottom: 4 }}>Action</label>
                <select style={{ ...inputStyle }} value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value }))}>
                  {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: '#8A8A8A', fontSize: 12, display: 'block', marginBottom: 4 }}>Schedule At *</label>
                <input type="datetime-local" style={{ ...inputStyle, colorScheme: 'dark' }} value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
              </div>
              <div>
                <label style={{ color: '#8A8A8A', fontSize: 12, display: 'block', marginBottom: 4 }}>Notes</label>
                <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} placeholder="Optional notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowModal(false)} style={{ ...btnGhost, flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!form.targetId || !form.scheduledAt || createMutation.isPending}
                style={{ ...btnGold, flex: 1, justifyContent: 'center', opacity: (!form.targetId || !form.scheduledAt) ? 0.5 : 1 }}
              >
                {createMutation.isPending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={14} />}
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

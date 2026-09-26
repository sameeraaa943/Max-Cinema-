import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock,
  Play,
  X,
  Trash2,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Film,
  Tv,
} from 'lucide-react';
import { toast } from 'sonner';
import { schedulerApi } from '../../services/api';

export default function ContentSchedulerPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [targetType, setTargetType] = useState('MOVIE');
  const [targetId, setTargetId] = useState('');
  const [action, setAction] = useState('PUBLISH');
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch Scheduled Tasks
  const { data, isLoading } = useQuery({
    queryKey: ['scheduled-tasks', statusFilter],
    queryFn: () => schedulerApi.list({ status: statusFilter === 'ALL' ? undefined : statusFilter }),
  });

  const tasks = data?.data?.data?.items || data?.data?.items || [];

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (taskData: any) => schedulerApi.create(taskData),
    onSuccess: () => {
      toast.success('Task scheduled successfully');
      queryClient.invalidateQueries({ queryKey: ['scheduled-tasks'] });
      setIsModalOpen(false);
      setTargetId('');
      setScheduledAt('');
      setNotes('');
    },
    onError: () => toast.error('Failed to schedule task'),
  });

  // Execute Now Mutation
  const executeNowMutation = useMutation({
    mutationFn: (id: string) => schedulerApi.executeNow(id),
    onSuccess: () => {
      toast.success('Task executed');
      queryClient.invalidateQueries({ queryKey: ['scheduled-tasks'] });
    },
  });

  // Cancel Mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) => schedulerApi.cancel(id),
    onSuccess: () => {
      toast.success('Task cancelled');
      queryClient.invalidateQueries({ queryKey: ['scheduled-tasks'] });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => schedulerApi.delete(id),
    onSuccess: () => {
      toast.success('Task deleted');
      queryClient.invalidateQueries({ queryKey: ['scheduled-tasks'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId.trim() || !scheduledAt) {
      toast.error('Target ID and Scheduled Date/Time are required');
      return;
    }
    createMutation.mutate({
      targetType,
      targetId,
      action,
      scheduledAt: new Date(scheduledAt).toISOString(),
      notes,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-cinzel tracking-wide">Content Scheduler</h1>
          <p className="text-xs text-muted mt-1">
            Schedule future automated publishing, spotlights, and takedowns.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold btn-gold transition-all self-start sm:self-auto"
          style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)', color: '#070707' }}
        >
          <Plus size={16} />
          <span>Schedule Task</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div
        className="p-3 rounded-xl flex items-center gap-1.5 overflow-x-auto"
        style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
      >
        {['ALL', 'PENDING', 'EXECUTED', 'FAILED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0"
            style={{
              backgroundColor: statusFilter === st ? '#D4AF37' : '#0D0D0D',
              color: statusFilter === st ? '#070707' : '#8A8A8A',
              border: statusFilter === st ? '1px solid #D4AF37' : '1px solid #242424',
            }}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Task List Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
      >
        {isLoading ? (
          <div className="p-8 text-center text-xs text-muted">
            <Loader2 size={16} className="animate-spin text-gold mx-auto mb-2" />
            <span>Loading scheduled tasks...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarClock size={32} className="mx-auto text-muted mb-2 opacity-50" />
            <h3 className="text-sm font-semibold text-white">No Scheduled Tasks Found</h3>
            <p className="text-xs text-muted mt-1">Add automated release schedules for upcoming content.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#242424] bg-[#0D0D0D] text-[11px] text-muted uppercase">
                  <th className="py-3 px-4">Target Content</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Scheduled For</th>
                  <th className="py-3 px-4">Executed At</th>
                  <th className="py-3 px-4 text-right">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {tasks.map((task: any) => (
                  <tr key={task.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4 font-mono text-white">
                      <div className="flex items-center gap-2">
                        {task.targetType === 'MOVIE' ? <Film size={13} className="text-gold" /> : <Tv size={13} className="text-purple-400" />}
                        <span>{task.targetId}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/5 border border-white/10 text-gray-200">
                        {task.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-semibold"
                        style={{
                          backgroundColor: task.status === 'EXECUTED' ? 'rgba(16,185,129,0.15)' : task.status === 'PENDING' ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)',
                          color: task.status === 'EXECUTED' ? '#34d399' : task.status === 'PENDING' ? '#facc15' : '#f87171',
                        }}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted">
                      {new Date(task.scheduledAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-muted">
                      {task.executedAt ? new Date(task.executedAt).toLocaleString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {task.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => executeNowMutation.mutate(task.id)}
                              className="p-1.5 rounded hover:bg-white/5 text-emerald-400"
                              title="Execute Now"
                            >
                              <Play size={13} />
                            </button>
                            <button
                              onClick={() => cancelMutation.mutate(task.id)}
                              className="p-1.5 rounded hover:bg-white/5 text-yellow-400"
                              title="Cancel Task"
                            >
                              <X size={13} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => deleteMutation.mutate(task.id)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-muted hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl p-6 bg-[#121212] border border-[#242424]">
            <h2 className="text-lg font-bold text-white font-cinzel">Schedule Content Automation</h2>
            <form onSubmit={handleCreate} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-muted font-medium mb-1">Target Type</label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white focus:outline-none"
                >
                  <option value="MOVIE">Movie</option>
                  <option value="TV_SHOW">TV Show</option>
                </select>
              </div>

              <div>
                <label className="block text-muted font-medium mb-1">Content ID</label>
                <input
                  type="text"
                  placeholder="e.g. cly... (Content ID)"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-muted font-medium mb-1">Action</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white focus:outline-none"
                >
                  <option value="PUBLISH">Publish to Live Site</option>
                  <option value="UNPUBLISH">Unpublish (Set to Draft)</option>
                  <option value="FEATURE">Add to Featured</option>
                  <option value="UNFEATURE">Remove from Featured</option>
                  <option value="SET_TRENDING">Add to Trending</option>
                  <option value="REMOVE_TRENDING">Remove from Trending</option>
                </select>
              </div>

              <div>
                <label className="block text-muted font-medium mb-1">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-muted font-medium mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Global Premiere embargo lift"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#242424]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-lg font-semibold btn-gold"
                  style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)', color: '#070707' }}
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  ShieldAlert,
  Trash2,
  CheckCheck,
  Loader2,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { alertsApi } from '../../services/api';

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  // Test Alert state
  const [testTitle, setTestTitle] = useState('High System Latency');
  const [testMessage, setTestMessage] = useState('TMDB API response time exceeded 2500ms threshold.');
  const [testSeverity, setTestSeverity] = useState('WARNING');
  const [testSource, setTestSource] = useState('INTEGRATION');

  // Fetch Alerts
  const { data, isLoading } = useQuery({
    queryKey: ['system-alerts', severityFilter],
    queryFn: () => alertsApi.list(),
  });

  const allAlerts: any[] = data?.data?.data || [];
  const alerts = severityFilter === 'ALL'
    ? allAlerts
    : allAlerts.filter((a) => a.severity === severityFilter);

  // Mark Read Mutation
  const markReadMutation = useMutation({
    mutationFn: (id: string) => alertsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-alerts'] });
      toast.success('Alert resolved');
    },
  });

  // Mark All Read Mutation
  const markAllReadMutation = useMutation({
    mutationFn: () => alertsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-alerts'] });
      toast.success('All alerts marked as resolved');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => alertsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-alerts'] });
      toast.success('Alert removed');
    },
  });

  // Simulate / Create Alert Mutation
  const testMutation = useMutation({
    mutationFn: (payload: any) => alertsApi.test(payload),
    onSuccess: () => {
      toast.success('Alert generated');
      queryClient.invalidateQueries({ queryKey: ['system-alerts'] });
      setIsTestModalOpen(false);
    },
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return { bg: 'rgba(239,68,68,0.15)', text: '#f87171', border: '1px solid rgba(239,68,68,0.3)', icon: ShieldAlert };
      case 'WARNING':
        return { bg: 'rgba(234,179,8,0.15)', text: '#facc15', border: '1px solid rgba(234,179,8,0.3)', icon: AlertTriangle };
      default:
        return { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', icon: Info };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-cinzel tracking-wide">System & Security Alerts</h1>
          <p className="text-xs text-muted mt-1">
            Real-time critical notices, performance degradation triggers, and security events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={allAlerts.length === 0 || markAllReadMutation.isPending}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#121212] border border-[#242424] text-muted hover:text-white flex items-center gap-1.5 transition-colors disabled:opacity-30"
          >
            <CheckCheck size={14} />
            <span>Resolve All</span>
          </button>

          <button
            onClick={() => setIsTestModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold btn-gold flex items-center gap-1.5"
            style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)', color: '#070707' }}
          >
            <Plus size={14} />
            <span>Trigger Test Alert</span>
          </button>
        </div>
      </div>

      {/* Severity Filter Tabs */}
      <div
        className="p-3 rounded-xl flex items-center gap-2"
        style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
      >
        {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((sev) => (
          <button
            key={sev}
            onClick={() => setSeverityFilter(sev)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              backgroundColor: severityFilter === sev ? '#D4AF37' : '#0D0D0D',
              color: severityFilter === sev ? '#070707' : '#8A8A8A',
              border: severityFilter === sev ? '1px solid #D4AF37' : '1px solid #242424',
            }}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-muted bg-[#121212] border border-[#242424] rounded-xl">
            <Loader2 size={16} className="animate-spin text-gold mx-auto mb-2" />
            <span>Checking alerts log...</span>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center bg-[#121212] border border-[#242424] rounded-xl">
            <CheckCircle size={32} className="text-emerald-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-white">All Systems Clear</h3>
            <p className="text-xs text-muted mt-1">No outstanding security or infrastructure alerts.</p>
          </div>
        ) : (
          alerts.map((alert: any) => {
            const badge = getSeverityBadge(alert.severity);
            const Icon = badge.icon;
            return (
              <div
                key={alert.id}
                className="p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                style={{
                  backgroundColor: alert.isRead ? '#0F0F0F' : '#141414',
                  border: alert.isRead ? '1px solid #202020' : '1px solid #2e2e2e',
                  borderLeft: `4px solid ${badge.text}`,
                  opacity: alert.isRead ? 0.6 : 1,
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg mt-0.5" style={{ backgroundColor: badge.bg, color: badge.text }}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{alert.title}</span>
                      <span
                        className="px-1.5 py-0.2 text-[9px] font-bold tracking-wider rounded uppercase"
                        style={{ backgroundColor: badge.bg, color: badge.text, border: badge.border }}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-[10px] text-muted font-mono uppercase">[{alert.source || 'SYSTEM'}]</span>
                    </div>
                    <p className="text-xs text-gray-300 mt-1">{alert.message}</p>
                    <div className="text-[10px] text-muted mt-1 font-mono">
                      {new Date(alert.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {!alert.isRead && (
                    <button
                      onClick={() => markReadMutation.mutate(alert.id)}
                      className="px-2.5 py-1 rounded-lg text-xs bg-[#1f1f1f] text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors flex items-center gap-1"
                    >
                      <CheckCircle size={12} />
                      <span>Resolve</span>
                    </button>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(alert.id)}
                    className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* TEST ALERT MODAL */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl p-6 bg-[#121212] border border-[#242424]">
            <h2 className="text-lg font-bold text-white font-cinzel">Simulate System Alert</h2>
            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-muted font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-muted font-medium mb-1">Severity</label>
                <select
                  value={testSeverity}
                  onChange={(e) => setTestSeverity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white focus:outline-none"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="WARNING">WARNING</option>
                  <option value="INFO">INFO</option>
                </select>
              </div>

              <div>
                <label className="block text-muted font-medium mb-1">Source</label>
                <select
                  value={testSource}
                  onChange={(e) => setTestSource(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white focus:outline-none"
                >
                  <option value="DATABASE">DATABASE</option>
                  <option value="SECURITY">SECURITY</option>
                  <option value="INTEGRATION">INTEGRATION</option>
                  <option value="SYSTEM">SYSTEM</option>
                </select>
              </div>

              <div>
                <label className="block text-muted font-medium mb-1">Message</label>
                <textarea
                  rows={3}
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#242424]">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() =>
                    testMutation.mutate({
                      title: testTitle,
                      message: testMessage,
                      severity: testSeverity,
                      source: testSource,
                    })
                  }
                  className="px-4 py-2 rounded-lg font-semibold btn-gold"
                  style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)', color: '#070707' }}
                >
                  Generate Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// File: src/pages/alerts/index.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, AlertTriangle, AlertCircle, CheckCircle, Info, Trash2, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { alertsApi } from '../../services/api';

const cardStyle: React.CSSProperties = { background: '#121212', border: '1px solid #242424', borderRadius: 12 };
const btnGold: React.CSSProperties = {
  background: 'linear-gradient(135deg, #D4AF37, #C5A028)', color: '#070707', border: 'none',
  borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
};
const btnGhost: React.CSSProperties = {
  background: 'transparent', color: '#8A8A8A', border: '1px solid #242424',
  borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
};

const SEV_COLORS: Record<string, { bg: string; color: string; icon: any }> = {
  CRITICAL: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', icon: AlertCircle },
  WARNING:  { bg: 'rgba(234,179,8,0.15)', color: '#eab308', icon: AlertTriangle },
  INFO:     { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', icon: Info },
};

export default function AlertsPage() {
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts-list'],
    queryFn: () => alertsApi.list().then(r => r.data?.data || []),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => alertsApi.markAllRead(),
    onSuccess: () => {
      toast.success('All alerts marked as read');
      queryClient.invalidateQueries({ queryKey: ['alerts-list'] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => alertsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts-list'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => alertsApi.delete(id),
    onSuccess: () => {
      toast.success('Alert deleted');
      queryClient.invalidateQueries({ queryKey: ['alerts-list'] });
    },
  });

  const testAlertMutation = useMutation({
    mutationFn: () => alertsApi.test({ title: 'Simulated TMDB Latency Spike', message: 'API latency surged to 1.4s over the threshold.', severity: 'WARNING' }),
    onSuccess: () => {
      toast.success('Test alert generated');
      queryClient.invalidateQueries({ queryKey: ['alerts-list'] });
    },
  });

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Bell size={28} color="#D4AF37" />
          <div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, fontFamily: 'Cinzel, serif' }}>Alert Center</h1>
            <p style={{ color: '#8A8A8A', fontSize: 13, marginTop: 2 }}>System health notifications, failure alarms, and security broadcasts</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={btnGhost} onClick={() => testAlertMutation.mutate()} disabled={testAlertMutation.isPending}>
            Simulate Alert
          </button>
          <button style={btnGold} onClick={() => markAllReadMutation.mutate()} disabled={markAllReadMutation.isPending}>
            <Check size={16} /> Mark All Read
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Loader2 size={32} color="#D4AF37" style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : alerts.length === 0 ? (
        <div style={{ ...cardStyle, padding: 60, textAlign: 'center' }}>
          <CheckCircle size={40} color="#22c55e" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#fff', fontWeight: 600 }}>All Clear!</p>
          <p style={{ color: '#8A8A8A', fontSize: 13, marginTop: 4 }}>No unresolved alerts or system notices.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {alerts.map((alert: any) => {
            const sev = SEV_COLORS[alert.severity] || SEV_COLORS.INFO;
            const Icon = sev.icon;
            return (
              <div
                key={alert.id}
                style={{
                  ...cardStyle,
                  padding: 18,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  borderLeft: `4px solid ${sev.color}`,
                  opacity: alert.isRead ? 0.6 : 1,
                }}
              >
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{ background: sev.bg, color: sev.color, padding: 8, borderRadius: 8, height: 'fit-content' }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{alert.title}</span>
                      <span style={{ background: sev.bg, color: sev.color, borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 700 }}>{alert.severity}</span>
                      {alert.isRead && <span style={{ color: '#8A8A8A', fontSize: 11 }}>[Read]</span>}
                    </div>
                    <p style={{ color: '#8A8A8A', fontSize: 13, marginTop: 4 }}>{alert.message}</p>
                    <div style={{ color: '#6b7280', fontSize: 11, marginTop: 6 }}>{new Date(alert.createdAt).toLocaleString()}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  {!alert.isRead && (
                    <button onClick={() => markReadMutation.mutate(alert.id)} style={{ ...btnGhost, padding: '6px 10px', fontSize: 12 }} title="Mark as read">
                      <Check size={14} />
                    </button>
                  )}
                  <button onClick={() => deleteMutation.mutate(alert.id)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

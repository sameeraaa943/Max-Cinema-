// File: src/pages/security/index.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock, ShieldCheck, Key, Users, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { securityApi } from '../../services/api';

const cardStyle: React.CSSProperties = { background: '#121212', border: '1px solid #242424', borderRadius: 12, padding: 20 };

export default function SecurityPage() {
  const queryClient = useQueryClient();

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['security-overview'],
    queryFn: () => securityApi.getOverview().then(r => r.data?.data || {}),
  });

  const { data: logins = [], isLoading: loadingLogins } = useQuery({
    queryKey: ['security-logins'],
    queryFn: () => securityApi.getLogins().then(r => r.data?.data || []),
  });

  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['security-sessions'],
    queryFn: () => securityApi.getActiveSessions().then(r => r.data?.data || []),
  });

  const revokeMutation = useMutation({
    mutationFn: (data: any) => securityApi.revokeSession(data),
    onSuccess: () => {
      toast.success('Session revoked');
      queryClient.invalidateQueries({ queryKey: ['security-sessions'] });
    },
  });

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Lock size={28} color="#D4AF37" />
        <div>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, fontFamily: 'Cinzel, serif' }}>Security Center</h1>
          <p style={{ color: '#8A8A8A', fontSize: 13, marginTop: 2 }}>Audit login events, active sessions, and access control policies</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Authentication', status: 'Secured (JWT + HttpOnly)', icon: ShieldCheck, color: '#22c55e' },
          { label: 'CORS Policy', status: 'Strict Origin Allowlist', icon: ShieldCheck, color: '#22c55e' },
          { label: 'Rate Limiting', status: 'Active (100 req/min)', icon: ShieldCheck, color: '#22c55e' },
          { label: 'Audit Logging', status: 'Enabled & Immutable', icon: ShieldCheck, color: '#22c55e' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#8A8A8A', fontSize: 12 }}>{item.label}</span>
                <Icon size={18} color={item.color} />
              </div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, marginTop: 10 }}>{item.status}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Recent Login History</h2>
          {loadingLogins ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 size={24} color="#D4AF37" style={{ animation: 'spin 1s linear infinite' }} /></div>
          ) : logins.length === 0 ? (
            <div style={{ ...cardStyle, padding: 30, textAlign: 'center', color: '#8A8A8A' }}>No login records logged.</div>
          ) : (
            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #242424' }}>
                    <th style={{ textAlign: 'left', padding: '10px 14px', color: '#8A8A8A', fontSize: 11 }}>ADMIN</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px', color: '#8A8A8A', fontSize: 11 }}>IP ADDRESS</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px', color: '#8A8A8A', fontSize: 11 }}>TIME</th>
                  </tr>
                </thead>
                <tbody>
                  {logins.map((l: any) => (
                    <tr key={l.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <td style={{ padding: '10px 14px', color: '#fff', fontSize: 12 }}>{l.email || l.adminName || 'Admin'}</td>
                      <td style={{ padding: '10px 14px', color: '#8A8A8A', fontSize: 12 }}>{l.ipAddress || '127.0.0.1'}</td>
                      <td style={{ padding: '10px 14px', color: '#8A8A8A', fontSize: 11 }}>{new Date(l.createdAt).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Active Admin Sessions</h2>
          {loadingSessions ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 size={24} color="#D4AF37" style={{ animation: 'spin 1s linear infinite' }} /></div>
          ) : sessions.length === 0 ? (
            <div style={{ ...cardStyle, padding: 30, textAlign: 'center', color: '#8A8A8A' }}>No other active sessions.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sessions.map((s: any) => (
                <div key={s.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{s.device || 'Desktop Browser'}</div>
                    <div style={{ color: '#8A8A8A', fontSize: 11, marginTop: 2 }}>{s.ipAddress || '127.0.0.1'} · Last active {new Date(s.lastActive || s.createdAt).toLocaleTimeString()}</div>
                  </div>
                  <button
                    onClick={() => revokeMutation.mutate({ sessionId: s.id })}
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

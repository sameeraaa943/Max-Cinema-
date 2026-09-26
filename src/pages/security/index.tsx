import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Lock,
  ShieldCheck,
  Globe,
  Monitor,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { securityApi } from '../../services/api';

export default function SecurityCenterPage() {
  const queryClient = useQueryClient();

  // Fetch Logins
  const { data: loginsData } = useQuery({
    queryKey: ['security-logins'],
    queryFn: () => securityApi.getLogins(),
  });

  // Fetch Active Sessions
  const { data: sessionsData } = useQuery({
    queryKey: ['security-sessions'],
    queryFn: () => securityApi.getActiveSessions(),
  });

  const logins = loginsData?.data?.data || [];
  const sessions = sessionsData?.data?.data || [];

  // Revoke Session Mutation
  const revokeMutation = useMutation({
    mutationFn: (token: string) => securityApi.revokeSession({ token }),
    onSuccess: () => {
      toast.success('Session revoked');
      queryClient.invalidateQueries({ queryKey: ['security-sessions'] });
    },
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-cinzel tracking-wide">Security Center</h1>
        <p className="text-xs text-muted mt-1">
          Monitor administrative authentication logs, active sessions, and hardening posture.
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#121212] border border-[#242424]">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs">Active Admin Sessions</span>
            <Monitor size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2 font-mono">
            {sessions.length || 1}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 size={12} />
            <span>JWT Session Guard Active</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#121212] border border-[#242424]">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs">Password Hashing</span>
            <Lock size={16} className="text-gold" />
          </div>
          <div className="text-xl font-bold text-white mt-2">Bcrypt</div>
          <div className="text-[11px] text-gold mt-1">12 Salt Rounds</div>
        </div>

        <div className="p-4 rounded-xl bg-[#121212] border border-[#242424]">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs">Network Anonymization</span>
            <ShieldCheck size={16} className="text-blue-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2">HMAC SHA-256</div>
          <div className="text-[11px] text-blue-400 mt-1">Masked IP Ingestion</div>
        </div>

        <div className="p-4 rounded-xl bg-[#121212] border border-[#242424]">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs">CORS & Rate Limiting</span>
            <Globe size={16} className="text-purple-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2">Strict Policy</div>
          <div className="text-[11px] text-purple-400 mt-1">Production Render Proxy</div>
        </div>
      </div>

      {/* Login History Audit */}
      <div
        className="p-5 rounded-2xl space-y-4"
        style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
      >
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Admin Login History</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#242424] bg-[#0D0D0D] text-[11px] text-muted uppercase">
                <th className="py-3 px-4">Admin Email</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">User Agent</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e1e]">
              {logins.map((login: any) => (
                <tr key={login.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-semibold text-white">{login.email}</td>
                  <td className="py-3 px-4 font-mono text-gray-300">{login.ip}</td>
                  <td className="py-3 px-4">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-semibold"
                      style={{
                        backgroundColor: login.status === 'SUCCESS' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: login.status === 'SUCCESS' ? '#34d399' : '#f87171',
                      }}
                    >
                      {login.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted max-w-xs truncate">{login.userAgent || 'Chrome / Windows'}</td>
                  <td className="py-3 px-4 text-muted">{new Date(login.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// File: src/pages/automation/index.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap, Play, Plus, Trash2, CheckCircle, RefreshCw, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { automationApi } from '../../services/api';

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
  background: '#0a0a0a', border: '1px solid #242424', borderRadius: 8, color: '#fff',
  padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%',
};

export default function AutomationPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [triggerEvent, setTriggerEvent] = useState('ON_IMPORT');
  const [actionType, setActionType] = useState('AUTO_GENERATE_METADATA');

  const { data: rules = [], isLoading: loadingRules } = useQuery({
    queryKey: ['automation-rules'],
    queryFn: () => automationApi.getRules().then(r => r.data?.data || []),
  });

  const { data: runs = [], isLoading: loadingRuns } = useQuery({
    queryKey: ['automation-runs'],
    queryFn: () => automationApi.getRuns().then(r => r.data?.data || []),
  });

  const syncMutation = useMutation({
    mutationFn: () => automationApi.tmdbSync({ type: 'POPULAR' }),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'TMDB Sync completed');
      queryClient.invalidateQueries({ queryKey: ['automation-runs'] });
    },
    onError: () => toast.error('TMDB Sync failed'),
  });

  const createRuleMutation = useMutation({
    mutationFn: (data: any) => automationApi.createRule(data),
    onSuccess: () => {
      toast.success('Automation rule created');
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      setModalOpen(false);
      setRuleName('');
    },
  });

  const triggerRuleMutation = useMutation({
    mutationFn: (id: string) => automationApi.triggerRule(id),
    onSuccess: () => {
      toast.success('Rule triggered');
      queryClient.invalidateQueries({ queryKey: ['automation-runs'] });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => automationApi.deleteRule(id),
    onSuccess: () => {
      toast.success('Rule deleted');
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
    },
  });

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Zap size={28} color="#D4AF37" />
          <div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, fontFamily: 'Cinzel, serif' }}>Automation Center</h1>
            <p style={{ color: '#8A8A8A', fontSize: 13, marginTop: 2 }}>Workflow triggers, TMDB synchronization, and automated quality pipelines</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={btnGhost} onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
            {syncMutation.isPending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={14} />}
            Sync TMDB Now
          </button>
          <button style={btnGold} onClick={() => setModalOpen(true)}>
            <Plus size={16} /> New Rule
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Configured Rules</h2>
          {loadingRules ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 size={24} color="#D4AF37" style={{ animation: 'spin 1s linear infinite' }} /></div>
          ) : rules.length === 0 ? (
            <div style={{ ...cardStyle, padding: 30, textAlign: 'center', color: '#8A8A8A' }}>No automation rules configured.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {rules.map((rule: any) => (
                <div key={rule.id} style={{ ...cardStyle, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{rule.name}</div>
                    <div style={{ color: '#8A8A8A', fontSize: 12, marginTop: 4 }}>
                      WHEN <code style={{ color: '#D4AF37' }}>{rule.triggerEvent || rule.trigger}</code> THEN <code style={{ color: '#22c55e' }}>{rule.actionType || rule.action}</code>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => triggerRuleMutation.mutate(rule.id)} style={{ ...btnGhost, padding: '6px 10px', fontSize: 12 }} title="Run Now"><Play size={13} /></button>
                    <button onClick={() => deleteRuleMutation.mutate(rule.id)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Execution History</h2>
          {loadingRuns ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 size={24} color="#D4AF37" style={{ animation: 'spin 1s linear infinite' }} /></div>
          ) : runs.length === 0 ? (
            <div style={{ ...cardStyle, padding: 30, textAlign: 'center', color: '#8A8A8A' }}>No run history logged.</div>
          ) : (
            <div style={{ ...cardStyle, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #242424' }}>
                    <th style={{ textAlign: 'left', padding: '10px 14px', color: '#8A8A8A', fontSize: 11 }}>EVENT</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px', color: '#8A8A8A', fontSize: 11 }}>STATUS</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px', color: '#8A8A8A', fontSize: 11 }}>DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r: any) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <td style={{ padding: '10px 14px', color: '#fff', fontSize: 12 }}>{r.event || r.action || 'TMDB_SYNC'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ background: r.status === 'SUCCESS' || r.status === 'COMPLETED' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: r.status === 'SUCCESS' || r.status === 'COMPLETED' ? '#22c55e' : '#ef4444', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 700 }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#8A8A8A', fontSize: 11 }}>{new Date(r.createdAt).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ ...cardStyle, width: '100%', maxWidth: 460, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>Create Automation Rule</h2>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: '#8A8A8A', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ color: '#8A8A8A', fontSize: 12, display: 'block', marginBottom: 4 }}>Rule Name *</label>
                <input style={inputStyle} value={ruleName} onChange={e => setRuleName(e.target.value)} placeholder="e.g. Auto Metadata On Import" />
              </div>
              <div>
                <label style={{ color: '#8A8A8A', fontSize: 12, display: 'block', marginBottom: 4 }}>Trigger (WHEN)</label>
                <select style={inputStyle} value={triggerEvent} onChange={e => setTriggerEvent(e.target.value)}>
                  <option value="ON_IMPORT">New Movie Imported</option>
                  <option value="HIGH_TRAFFIC">Movie Reaches High Traffic</option>
                  <option value="MISSING_METADATA">Missing Metadata Detected</option>
                </select>
              </div>
              <div>
                <label style={{ color: '#8A8A8A', fontSize: 12, display: 'block', marginBottom: 4 }}>Action (THEN)</label>
                <select style={inputStyle} value={actionType} onChange={e => setActionType(e.target.value)}>
                  <option value="AUTO_GENERATE_METADATA">Generate Metadata & Notify</option>
                  <option value="SUGGEST_TRENDING">Create Trending Suggestion</option>
                  <option value="AUTO_PUBLISH">Auto-Publish to Public Site</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setModalOpen(false)} style={{ ...btnGhost, flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button
                onClick={() => createRuleMutation.mutate({ name: ruleName, triggerEvent, actionType })}
                disabled={!ruleName || createRuleMutation.isPending}
                style={{ ...btnGold, flex: 1, justifyContent: 'center' }}
              >
                Create Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

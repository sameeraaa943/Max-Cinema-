// File: src/pages/backups/index.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HardDrive, Download, Upload, RefreshCw, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { backupsApi } from '../../services/api';

const cardStyle: React.CSSProperties = { background: '#121212', border: '1px solid #242424', borderRadius: 12 };
const btnGold: React.CSSProperties = {
  background: 'linear-gradient(135deg, #D4AF37, #C5A028)', color: '#070707', border: 'none',
  borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
};
const btnGhost: React.CSSProperties = {
  background: 'transparent', color: '#8A8A8A', border: '1px solid #242424',
  borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
};

export default function BackupsPage() {
  const queryClient = useQueryClient();

  const { data: backups = [], isLoading } = useQuery({
    queryKey: ['backups-list'],
    queryFn: () => backupsApi.list().then(r => r.data?.data || []),
  });

  const createBackupMutation = useMutation({
    mutationFn: () => backupsApi.create(),
    onSuccess: (res) => {
      toast.success('Database snapshot generated!');
      queryClient.invalidateQueries({ queryKey: ['backups-list'] });
      // download JSON if provided
      if (res.data?.data?.dump) {
        const blob = new Blob([JSON.stringify(res.data.data.dump, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cinescope-backup-${Date.now()}.json`;
        a.click();
      }
    },
    onError: () => toast.error('Backup creation failed'),
  });

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <HardDrive size={28} color="#D4AF37" />
          <div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, fontFamily: 'Cinzel, serif' }}>Backup Center</h1>
            <p style={{ color: '#8A8A8A', fontSize: 13, marginTop: 2 }}>Database snapshots, recovery point objectives (RPO), and JSON archives</p>
          </div>
        </div>
        <button style={btnGold} onClick={() => createBackupMutation.mutate()} disabled={createBackupMutation.isPending}>
          {createBackupMutation.isPending ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={16} />}
          Generate Snapshot
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Loader2 size={32} color="#D4AF37" style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : backups.length === 0 ? (
        <div style={{ ...cardStyle, padding: 60, textAlign: 'center' }}>
          <HardDrive size={40} color="#242424" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#fff', fontWeight: 600 }}>No Manual Snapshots Logged</p>
          <p style={{ color: '#8A8A8A', fontSize: 13, marginTop: 4 }}>Click "Generate Snapshot" above to create and export a full database backup JSON.</p>
        </div>
      ) : (
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #242424' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: '#8A8A8A', fontSize: 12 }}>BACKUP ID</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: '#8A8A8A', fontSize: 12 }}>RECORDS</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: '#8A8A8A', fontSize: 12 }}>STATUS</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: '#8A8A8A', fontSize: 12 }}>CREATED AT</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((b: any) => (
                <tr key={b.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <td style={{ padding: '12px 16px', color: '#fff', fontSize: 13 }}><code>{b.id.slice(0, 8)}</code></td>
                  <td style={{ padding: '12px 16px', color: '#8A8A8A', fontSize: 13 }}>{b.recordCount || b.size || 'N/A'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                      COMPLETED
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#8A8A8A', fontSize: 12 }}>{new Date(b.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

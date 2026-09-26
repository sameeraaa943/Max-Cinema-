import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RotateCcw,
  Plus,
  Loader2,
  FileJson,
} from 'lucide-react';
import { toast } from 'sonner';
import { backupsApi } from '../../services/api';

export default function BackupsPage() {
  const queryClient = useQueryClient();
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [selectedBackupId, setSelectedBackupId] = useState('');

  // Fetch Backups
  const { data } = useQuery({
    queryKey: ['system-backups'],
    queryFn: () => backupsApi.list(),
  });

  const backups = data?.data?.data || [];

  // Create Backup Snapshot Mutation
  const createMutation = useMutation({
    mutationFn: () => backupsApi.create(),
    onSuccess: () => {
      toast.success('Database backup created successfully');
      queryClient.invalidateQueries({ queryKey: ['system-backups'] });
    },
    onError: () => toast.error('Failed to create database backup'),
  });

  // Restore Mutation
  const restoreMutation = useMutation({
    mutationFn: (id: string) => backupsApi.restore({ backupId: id }),
    onSuccess: () => {
      toast.success('Database snapshot restored');
      setIsRestoreOpen(false);
    },
    onError: () => toast.error('Failed to restore backup'),
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-cinzel tracking-wide">Backup & Disaster Recovery</h1>
          <p className="text-xs text-muted mt-1">
            Generate and restore complete JSON snapshot dumps of movies, TV shows, configurations, and user records.
          </p>
        </div>

        <button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold btn-gold transition-all self-start sm:self-auto disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)', color: '#070707' }}
        >
          {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          <span>Create Instant Backup</span>
        </button>
      </div>

      {/* Snapshot List */}
      <div
        className="rounded-xl overflow-hidden border border-[#242424]"
        style={{ backgroundColor: '#121212' }}
      >
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#242424] bg-[#0D0D0D] text-[11px] text-muted uppercase">
              <th className="py-3 px-4">Snapshot ID / Checksum</th>
              <th className="py-3 px-4">Size</th>
              <th className="py-3 px-4">Record Count</th>
              <th className="py-3 px-4">Created At</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e1e1e]">
            {backups.map((b: any) => (
              <tr key={b.id} className="hover:bg-white/[0.02]">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <FileJson size={16} className="text-gold" />
                    <div>
                      <span className="font-mono text-white font-semibold">{b.id}</span>
                      <div className="text-[10px] text-muted font-mono">{b.checksum ? `SHA: ${b.checksum.slice(0, 16)}...` : 'Automatic Export'}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-muted">
                  {b.sizeBytes ? `${(b.sizeBytes / 1024).toFixed(1)} KB` : '142.4 KB'}
                </td>
                <td className="py-3 px-4 font-mono text-white">
                  {b.recordCount || '—'}
                </td>
                <td className="py-3 px-4 text-muted">
                  {new Date(b.createdAt).toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setSelectedBackupId(b.id);
                        setIsRestoreOpen(true);
                      }}
                      className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 text-xs flex items-center gap-1"
                    >
                      <RotateCcw size={12} />
                      <span>Restore</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Restore Confirmation Modal */}
      {isRestoreOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl p-6 bg-[#121212] border border-[#242424]">
            <h2 className="text-lg font-bold text-white font-cinzel">Confirm Database Restore</h2>
            <p className="text-xs text-muted mt-1">
              Restoring snapshot <strong className="text-white">{selectedBackupId}</strong> will apply historical state. Are you sure you want to proceed?
            </p>

            <div className="flex justify-end gap-2 pt-4 border-t border-[#242424] mt-4">
              <button
                type="button"
                onClick={() => setIsRestoreOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-muted hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={restoreMutation.isPending}
                onClick={() => restoreMutation.mutate(selectedBackupId)}
                className="px-4 py-2 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white text-xs flex items-center gap-1"
              >
                {restoreMutation.isPending ? 'Restoring...' : 'Confirm Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

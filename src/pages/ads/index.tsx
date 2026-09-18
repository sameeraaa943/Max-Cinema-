import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Code,
  Smartphone,
  Monitor,
  Calendar,
  X,
  Save,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { adsApi } from '../../services/api';
import { Advertisement, AdPlacement, AdDeviceTarget } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';

const placements: AdPlacement[] = [
  'HEADER',
  'HOMEPAGE',
  'MOVIE_PAGE',
  'TV_PAGE',
  'SEARCH_RESULTS',
  'BETWEEN_CONTENT',
  'FOOTER',
];

export default function AdsPage() {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [placement, setPlacement] = useState<AdPlacement>('HOMEPAGE');
  const [adCode, setAdCode] = useState('');
  const [deviceTarget, setDeviceTarget] = useState<AdDeviceTarget>('ALL');
  const [priority, setPriority] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['ads'],
    queryFn: () => adsApi.list(),
  });
  const ads: Advertisement[] = data?.data?.data || [];

  const openCreateModal = () => {
    setEditingAd(null);
    setName('');
    setPlacement('HOMEPAGE');
    setAdCode('');
    setDeviceTarget('ALL');
    setPriority(0);
    setEnabled(true);
    setStartDate('');
    setEndDate('');
    setIsModalOpen(true);
  };

  const openEditModal = (ad: Advertisement) => {
    setEditingAd(ad);
    setName(ad.name);
    setPlacement(ad.placement);
    setAdCode(ad.adCode);
    setDeviceTarget(ad.deviceTarget);
    setPriority(ad.priority);
    setEnabled(ad.enabled);
    setStartDate(ad.startDate ? ad.startDate.split('T')[0] : '');
    setEndDate(ad.endDate ? ad.endDate.split('T')[0] : '');
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => {
      if (editingAd) return adsApi.update(editingAd.id, payload);
      return adsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      toast.success(editingAd ? 'Ad updated' : 'Ad created');
      setIsModalOpen(false);
    },
    onError: (err: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((err as any).response?.data?.error || 'Failed to save ad');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adsApi.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      toast.success('Ad status toggled');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      toast.success('Ad deleted');
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to delete ad'),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !adCode.trim()) return;
    saveMutation.mutate({
      name,
      placement,
      adCode,
      deviceTarget,
      priority: Number(priority),
      enabled,
      startDate: startDate || null,
      endDate: endDate || null,
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-cinzel tracking-wide flex items-center gap-2">
            <DollarSign size={22} style={{ color: '#D4AF37' }} />
            <span>Advertisement Management</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Configure Google AdSense slots, sponsor banners, and custom display ad codes
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold btn-gold transition-all self-start sm:self-auto"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)',
            color: '#070707',
          }}
        >
          <Plus size={16} />
          <span>New Ad Unit</span>
        </button>
      </div>

      {/* AdSense Info Banner */}
      <div
        className="p-4 rounded-xl flex items-center justify-between text-xs"
        style={{
          backgroundColor: 'rgba(212,175,55,0.06)',
          border: '1px solid rgba(212,175,55,0.2)',
        }}
      >
        <div className="flex items-center gap-3">
          <Code size={18} style={{ color: '#D4AF37' }} />
          <div>
            <span className="font-semibold text-white">Google AdSense Publisher Detected: </span>
            <code className="text-[#D4AF37] font-mono">ca-pub-1450329989131749</code>
            <p className="text-muted text-[11px] mt-0.5">
              Units created here will be served through the public API to the matching placement zones.
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
      >
        {isLoading ? (
          <div className="p-6">
            <LoadingSkeleton lines={5} height="45px" />
          </div>
        ) : ads.length === 0 ? (
          <EmptyState
            title="No ad units created yet"
            description="Create your first advertisement placement to display banners or Google AdSense ads on CineScope."
            icon={DollarSign}
            action={{
              label: 'Create Ad Unit',
              onClick: openCreateModal,
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-semibold text-muted uppercase tracking-wider border-b border-[#242424]" style={{ backgroundColor: '#0D0D0D' }}>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Placement</th>
                  <th className="py-3.5 px-4">Device</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Schedule</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f1f] text-xs">
                {ads.map((ad) => (
                  <tr key={ad.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">
                      {ad.name}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold"
                        style={{ backgroundColor: '#1a1a1a', color: '#D4AF37', border: '1px solid #242424' }}
                      >
                        {ad.placement}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-muted flex items-center gap-1.5">
                      {ad.deviceTarget === 'MOBILE' ? (
                        <Smartphone size={14} />
                      ) : ad.deviceTarget === 'DESKTOP' ? (
                        <Monitor size={14} />
                      ) : (
                        <span>All Devices</span>
                      )}
                      <span>{ad.deviceTarget}</span>
                    </td>

                    <td className="py-3 px-4 font-mono">{ad.priority}</td>

                    <td className="py-3 px-4 text-muted text-[11px]">
                      {ad.startDate || ad.endDate ? (
                        <span>
                          {ad.startDate ? new Date(ad.startDate).toLocaleDateString() : 'Now'} →{' '}
                          {ad.endDate ? new Date(ad.endDate).toLocaleDateString() : 'Forever'}
                        </span>
                      ) : (
                        <span>Always Active</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleMutation.mutate(ad.id)}
                        className="px-2.5 py-1 rounded text-xs font-semibold transition-all"
                        style={{
                          backgroundColor: ad.enabled ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                          color: ad.enabled ? '#4ade80' : '#f87171',
                          border: `1px solid ${ad.enabled ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        }}
                      >
                        {ad.enabled ? 'Active' : 'Disabled'}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(ad)}
                          className="p-1.5 rounded hover:bg-white/5 text-muted hover:text-white transition-colors"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteId(ad.id);
                            setDeleteName(ad.name);
                          }}
                          className="p-1.5 rounded hover:bg-red-500/10 text-muted hover:text-red-400 transition-colors"
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

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6 relative fade-in-up"
            style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
              <h3 className="text-sm font-semibold text-white">
                {editingAd ? 'Edit Ad Unit' : 'Create New Ad Unit'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Unit Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Header Leaderboard 728x90"
                  className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none"
                  style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Placement</label>
                  <select
                    value={placement}
                    onChange={(e) => setPlacement(e.target.value as AdPlacement)}
                    className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none"
                    style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
                  >
                    {placements.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Target Device</label>
                  <select
                    value={deviceTarget}
                    onChange={(e) => setDeviceTarget(e.target.value as AdDeviceTarget)}
                    className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none"
                    style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
                  >
                    <option value="ALL">All Devices</option>
                    <option value="DESKTOP">Desktop Only</option>
                    <option value="MOBILE">Mobile Only</option>
                    <option value="TABLET">Tablet Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  Ad HTML / Script Code *
                </label>
                <textarea
                  rows={5}
                  required
                  value={adCode}
                  onChange={(e) => setAdCode(e.target.value)}
                  placeholder="<script async src='https://pagead2.googlesyndication.com/...'></script>"
                  className="w-full px-3 py-2 rounded-lg text-xs font-mono focus:outline-none"
                  style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none"
                    style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none"
                    style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Priority (0-100)</label>
                  <input
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-20 px-3 py-1.5 rounded-lg text-xs font-mono focus:outline-none"
                    style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
                  />
                </div>

                <label className="flex items-center gap-2 text-xs text-white cursor-pointer pt-4">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    style={{ accentColor: '#D4AF37' }}
                  />
                  <span>Active & Serving</span>
                </label>
              </div>

              <div className="pt-4 border-t border-[#242424] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs text-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-4 py-2 rounded-lg text-xs font-bold btn-gold flex items-center gap-1.5"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)',
                    color: '#070707',
                  }}
                >
                  <Save size={14} />
                  <span>{editingAd ? 'Save Changes' : 'Create Ad Unit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Ad Unit"
        message={`Are you sure you want to delete "${deleteName}"? It will no longer serve to public visitors.`}
        confirmLabel="Delete Ad"
        danger={true}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}


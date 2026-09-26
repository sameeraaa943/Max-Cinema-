import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Pin,
  Search,
  Plus,
  Trash2,
  Globe,
  Monitor,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Shield,
  Film,
  Tv,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { networkPinsApi, moviesApi, tvShowsApi } from '../../services/api';

interface NetworkPin {
  id: string;
  mediaId: string;
  mediaType: 'MOVIE' | 'TV_SHOW';
  scope: 'NETWORK' | 'DEVICE' | 'ACCOUNT';
  maskedIp: string | null;
  networkHash: string;
  note: string | null;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export default function NetworkPinsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'NETWORK' | 'DEVICE' | 'ACCOUNT'>('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [mediaType, setMediaType] = useState<'MOVIE' | 'TV_SHOW'>('MOVIE');
  const [mediaSearch, setMediaSearch] = useState('');
  const [selectedMediaId, setSelectedMediaId] = useState('');
  const [selectedMediaTitle, setSelectedMediaTitle] = useState('');
  const [scope, setScope] = useState<'NETWORK' | 'DEVICE' | 'ACCOUNT'>('NETWORK');
  const [customIp, setCustomIp] = useState('');
  const [note, setNote] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('30');

  // Fetch Pins
  const { data: pinsData, isLoading } = useQuery({
    queryKey: ['network-pins', search, scopeFilter],
    queryFn: () => networkPinsApi.list({ search, scope: scopeFilter === 'ALL' ? undefined : scopeFilter }),
  });

  const pins: NetworkPin[] = pinsData?.data?.data?.items || [];
  const clientInfo = pinsData?.data?.data?.clientInfo;

  // Search Media for modal
  const { data: mediaResults } = useQuery({
    queryKey: ['media-search', mediaType, mediaSearch],
    queryFn: async () => {
      if (!mediaSearch.trim()) return [];
      if (mediaType === 'MOVIE') {
        const res = await moviesApi.list({ search: mediaSearch, limit: 6 });
        return res.data?.data?.items || [];
      } else {
        const res = await tvShowsApi.list({ search: mediaSearch, limit: 6 });
        return res.data?.data?.items || [];
      }
    },
    enabled: mediaSearch.length > 1,
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => networkPinsApi.create(data),
    onSuccess: () => {
      toast.success('Network pin created successfully');
      queryClient.invalidateQueries({ queryKey: ['network-pins'] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to create network pin');
    },
  });

  // Toggle Mutation
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      networkPinsApi.update(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-pins'] });
      toast.success('Pin status updated');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => networkPinsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-pins'] });
      toast.success('Pin removed');
    },
  });

  const resetForm = () => {
    setSelectedMediaId('');
    setSelectedMediaTitle('');
    setMediaSearch('');
    setCustomIp('');
    setNote('');
    setExpiresInDays('30');
    setScope('NETWORK');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMediaId) {
      toast.error('Please select a movie or TV show to pin');
      return;
    }

    const expiresAt = expiresInDays === 'never'
      ? null
      : new Date(Date.now() + parseInt(expiresInDays) * 86400000).toISOString();

    createMutation.mutate({
      mediaId: selectedMediaId,
      mediaType,
      scope,
      customIp: customIp.trim() || undefined,
      note: note.trim() || undefined,
      expiresAt,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white font-cinzel tracking-wide">Network & IP Movie Pins</h1>
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider"
              style={{ backgroundColor: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}
            >
              V5.1 LIVE
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            Pin priority movies and TV shows across specific networks, devices, or accounts using privacy-safe HMAC SHA-256 matching.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold btn-gold transition-all self-start sm:self-auto"
          style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)', color: '#070707' }}
        >
          <Plus size={16} />
          <span>Create Network Pin</span>
        </button>
      </div>

      {/* Detected Network Banner */}
      {clientInfo && (
        <div
          className="p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
          style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'rgba(212,175,55,0.1)', color: '#D4AF37' }}>
              <Shield size={20} />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Your Current Network Fingerprint</div>
              <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                <span>Masked IP: <strong className="text-gray-300">{clientInfo.maskedIp}</strong></span>
                <span>•</span>
                <span>Hash: <code className="text-[10px] font-mono text-gray-400">{clientInfo.networkHash.slice(0, 12)}...</code></span>
              </div>
            </div>
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium">
            <CheckCircle2 size={14} />
            <span>Privacy-Safe Salted Matching Active</span>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div
        className="p-3 rounded-xl flex flex-col md:flex-row items-center gap-3"
        style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
      >
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search pins by title, media ID, or note..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg text-xs transition-colors focus:outline-none"
            style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          {(['ALL', 'NETWORK', 'DEVICE', 'ACCOUNT'] as const).map((sc) => (
            <button
              key={sc}
              onClick={() => setScopeFilter(sc)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0"
              style={{
                backgroundColor: scopeFilter === sc ? '#D4AF37' : '#0D0D0D',
                color: scopeFilter === sc ? '#070707' : '#8A8A8A',
                border: scopeFilter === sc ? '1px solid #D4AF37' : '1px solid #242424',
              }}
            >
              {sc}
            </button>
          ))}
        </div>
      </div>

      {/* Pins Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
      >
        {isLoading ? (
          <div className="p-8 flex items-center justify-center gap-2 text-muted text-xs">
            <Loader2 size={16} className="animate-spin text-gold" />
            <span>Loading network pins...</span>
          </div>
        ) : pins.length === 0 ? (
          <div className="p-12 text-center">
            <Pin size={32} className="mx-auto text-muted mb-2 opacity-50" />
            <h3 className="text-sm font-semibold text-white">No Network Pins Configured</h3>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
              Pins allow you to showcase customized movies or TV shows exclusively to specific offices, living rooms, or client IP ranges.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-4 px-4 py-2 rounded-lg text-xs font-semibold btn-gold"
              style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)', color: '#070707' }}
            >
              Add First Pin
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#242424] text-[11px] font-semibold text-muted uppercase tracking-wider" style={{ backgroundColor: '#0D0D0D' }}>
                  <th className="py-3 px-4">Target Content</th>
                  <th className="py-3 px-4">Scope</th>
                  <th className="py-3 px-4">Network ID</th>
                  <th className="py-3 px-4">Note</th>
                  <th className="py-3 px-4">Expires</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {pins.map((pin) => (
                  <tr key={pin.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {pin.mediaType === 'MOVIE' ? (
                          <Film size={14} className="text-gold shrink-0" />
                        ) : (
                          <Tv size={14} className="text-purple-400 shrink-0" />
                        )}
                        <div>
                          <span className="font-semibold text-white">{pin.mediaId}</span>
                          <span className="text-[10px] text-muted ml-2">({pin.mediaType})</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 w-fit"
                        style={{
                          backgroundColor: pin.scope === 'NETWORK' ? 'rgba(59,130,246,0.15)' : pin.scope === 'DEVICE' ? 'rgba(168,85,247,0.15)' : 'rgba(234,179,8,0.15)',
                          color: pin.scope === 'NETWORK' ? '#60a5fa' : pin.scope === 'DEVICE' ? '#c084fc' : '#facc15',
                          border: `1px solid ${pin.scope === 'NETWORK' ? 'rgba(59,130,246,0.3)' : pin.scope === 'DEVICE' ? 'rgba(168,85,247,0.3)' : 'rgba(234,179,8,0.3)'}`,
                        }}
                      >
                        {pin.scope === 'NETWORK' && <Globe size={11} />}
                        {pin.scope === 'DEVICE' && <Monitor size={11} />}
                        {pin.scope === 'ACCOUNT' && <User size={11} />}
                        <span>{pin.scope}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-gray-300">
                      {pin.maskedIp ? pin.maskedIp : `${pin.networkHash.slice(0, 14)}...`}
                    </td>
                    <td className="py-3 px-4 text-muted max-w-xs truncate">
                      {pin.note || '—'}
                    </td>
                    <td className="py-3 px-4 text-muted">
                      {pin.expiresAt ? (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(pin.expiresAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-gray-500 font-mono">Permanent</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleMutation.mutate({ id: pin.id, isActive: !pin.isActive })}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer transition-colors"
                        style={{
                          backgroundColor: pin.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                          color: pin.isActive ? '#34d399' : '#f87171',
                          border: `1px solid ${pin.isActive ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        }}
                      >
                        {pin.isActive ? 'ACTIVE' : 'DISABLED'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => deleteMutation.mutate(pin.id)}
                        className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete Pin"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE PIN MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className="w-full max-w-lg rounded-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150"
            style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
          >
            <h2 className="text-lg font-bold text-white font-cinzel">Create Network Movie Pin</h2>
            <p className="text-xs text-muted mt-0.5">
              Select media and assign it to your current network or an explicit IP range.
            </p>

            <form onSubmit={handleCreate} className="mt-4 space-y-4 text-xs">
              {/* Media Type & Search */}
              <div>
                <label className="block text-muted font-medium mb-1.5">1. Target Media Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setMediaType('MOVIE'); setSelectedMediaId(''); }}
                    className="flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all"
                    style={{
                      backgroundColor: mediaType === 'MOVIE' ? '#D4AF37' : '#0D0D0D',
                      color: mediaType === 'MOVIE' ? '#070707' : '#8A8A8A',
                      border: mediaType === 'MOVIE' ? '1px solid #D4AF37' : '1px solid #242424',
                    }}
                  >
                    <Film size={14} />
                    <span>Movie</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMediaType('TV_SHOW'); setSelectedMediaId(''); }}
                    className="flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all"
                    style={{
                      backgroundColor: mediaType === 'TV_SHOW' ? '#D4AF37' : '#0D0D0D',
                      color: mediaType === 'TV_SHOW' ? '#070707' : '#8A8A8A',
                      border: mediaType === 'TV_SHOW' ? '1px solid #D4AF37' : '1px solid #242424',
                    }}
                  >
                    <Tv size={14} />
                    <span>TV Show</span>
                  </button>
                </div>
              </div>

              {/* Media Search Input */}
              <div className="relative">
                <label className="block text-muted font-medium mb-1.5">2. Select Content</label>
                <input
                  type="text"
                  placeholder={`Search ${mediaType === 'MOVIE' ? 'movies' : 'TV shows'} by title...`}
                  value={mediaSearch}
                  onChange={(e) => setMediaSearch(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white focus:outline-none"
                />

                {selectedMediaTitle && (
                  <div className="mt-1.5 p-2 rounded bg-gold/10 border border-gold/30 text-gold flex items-center justify-between text-xs font-semibold">
                    <span>Selected: {selectedMediaTitle} ({selectedMediaId})</span>
                    <button type="button" onClick={() => setSelectedMediaId('')} className="text-muted hover:text-white">✕</button>
                  </div>
                )}

                {mediaResults && mediaResults.length > 0 && !selectedMediaId && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-[#181818] border border-[#2e2e2e] rounded-lg shadow-2xl z-20 max-h-48 overflow-y-auto divide-y divide-[#242424]">
                    {mediaResults.map((item: any) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedMediaId(item.id);
                          setSelectedMediaTitle(item.title || item.name);
                          setMediaSearch('');
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-white/5 flex items-center justify-between text-xs"
                      >
                        <span className="text-white font-medium">{item.title || item.name}</span>
                        <span className="text-[10px] text-muted">{item.id.slice(0, 8)}...</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Scope */}
              <div>
                <label className="block text-muted font-medium mb-1.5">3. Pin Scope</label>
                <select
                  value={scope}
                  onChange={(e: any) => setScope(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white focus:outline-none"
                >
                  <option value="NETWORK">Network (All users on this public Wi-Fi/IP)</option>
                  <option value="DEVICE">Device (Current browser/hardware)</option>
                  <option value="ACCOUNT">Account (Tied to user account)</option>
                </select>
              </div>

              {/* Explicit IP (Optional) */}
              <div>
                <label className="block text-muted font-medium mb-1.5">
                  4. Specific Public IP <span className="text-gray-500">(Leave blank for your current network)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 198.51.100.45"
                  value={customIp}
                  onChange={(e) => setCustomIp(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white font-mono text-xs focus:outline-none"
                />
              </div>

              {/* Expiration */}
              <div>
                <label className="block text-muted font-medium mb-1.5">5. Duration</label>
                <select
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white focus:outline-none"
                >
                  <option value="7">7 Days</option>
                  <option value="30">30 Days</option>
                  <option value="90">90 Days</option>
                  <option value="365">1 Year</option>
                  <option value="never">Permanent (Never expires)</option>
                </select>
              </div>

              {/* Note */}
              <div>
                <label className="block text-muted font-medium mb-1.5">6. Note / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Office Lounge Showcase, Featured Premiere for VIP room"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white focus:outline-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-[#242424]">
                <button
                  type="button"
                  onClick={() => { setIsCreateOpen(false); resetForm(); }}
                  className="px-4 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-muted hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !selectedMediaId}
                  className="px-4 py-2 rounded-lg font-semibold btn-gold disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)', color: '#070707' }}
                >
                  {createMutation.isPending ? 'Creating Pin...' : 'Create Network Pin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

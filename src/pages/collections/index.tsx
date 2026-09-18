import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Film,
  ExternalLink,
  X,
  Save,
  Globe,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { collectionsApi } from '../../services/api';
import { Collection } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';

export default function CollectionsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [featured, setFeatured] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: () => collectionsApi.list(),
  });
  const collections: Collection[] = data?.data?.data || [];

  const openCreateModal = () => {
    setEditingCollection(null);
    setName('');
    setSlug('');
    setDescription('');
    setCoverImage('');
    setVisibility('PUBLIC');
    setFeatured(false);
    setIsModalOpen(true);
  };

  const openEditModal = (col: Collection, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCollection(col);
    setName(col.name);
    setSlug(col.slug);
    setDescription(col.description || '');
    setCoverImage(col.coverImage || '');
    setVisibility(col.visibility || 'PUBLIC');
    setFeatured(col.featured || false);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCollection) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      );
    }
  };

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => {
      if (editingCollection) {
        return collectionsApi.update(editingCollection.id, payload);
      }
      return collectionsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success(editingCollection ? 'Collection updated' : 'Collection created');
      setIsModalOpen(false);
    },
    onError: (err: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((err as any).response?.data?.error || 'Failed to save collection');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => collectionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success('Collection deleted');
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to delete collection'),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    saveMutation.mutate({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description,
      coverImage: coverImage || null,
      visibility,
      featured,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-cinzel tracking-wide flex items-center gap-2">
            <BookOpen size={22} style={{ color: '#D4AF37' }} />
            <span>Curated Collections</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Group movies and TV shows into thematic playlists, franchises, and festival retrospectives
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
          <span>New Collection</span>
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <LoadingSkeleton lines={4} height="120px" />
      ) : collections.length === 0 ? (
        <EmptyState
          title="No collections created yet"
          description="Collections let you group titles (e.g. 'Marvel Cinematic Universe', 'Oscar Winners 2026', 'Cyberpunk Noir')."
          icon={BookOpen}
          action={{
            label: 'Create First Collection',
            onClick: openCreateModal,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((col) => (
            <div
              key={col.id}
              onClick={() => navigate(`/collections/${col.id}`)}
              className="rounded-xl overflow-hidden card-hover cursor-pointer flex flex-col group transition-all"
              style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
            >
              {/* Cover Banner */}
              <div
                className="h-36 relative overflow-hidden flex items-center justify-center"
                style={{ backgroundColor: '#161616' }}
              >
                {col.coverImage ? (
                  <img
                    src={col.coverImage}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <BookOpen size={32} className="text-muted/20" />
                )}
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, #121212 0%, transparent 80%)' }}
                />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1"
                    style={
                      col.visibility === 'PUBLIC'
                        ? { backgroundColor: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid #22c55e' }
                        : { backgroundColor: 'rgba(138,138,138,0.2)', color: '#8A8A8A', border: '1px solid #666' }
                    }
                  >
                    {col.visibility === 'PUBLIC' ? <Globe size={10} /> : <Lock size={10} />}
                    {col.visibility}
                  </span>
                  {col.featured && (
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-semibold"
                      style={{ backgroundColor: 'rgba(212,175,55,0.2)', color: '#D4AF37', border: '1px solid #D4AF37' }}
                    >
                      Featured
                    </span>
                  )}
                </div>

                {/* Item count */}
                <div
                  className="absolute bottom-3 right-3 px-2 py-0.5 rounded text-[11px] font-semibold font-mono"
                  style={{ backgroundColor: 'rgba(0,0,0,0.85)', color: '#FFFFFF', border: '1px solid #242424' }}
                >
                  {col.itemCount} items
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-[#D4AF37] transition-colors font-cinzel">
                    {col.name}
                  </h3>
                  <span className="text-[11px] font-mono text-muted block mt-0.5">
                    /collections/{col.slug}
                  </span>
                  {col.description && (
                    <p className="text-xs text-muted mt-2 line-clamp-2 leading-relaxed">
                      {col.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-5 pt-3 border-t border-[#1f1f1f] text-xs">
                  <span className="text-[#D4AF37] flex items-center gap-1 font-semibold">
                    <span>Manage Items</span>
                    <ExternalLink size={12} />
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => openEditModal(col, e)}
                      className="p-1.5 rounded hover:bg-white/5 text-muted hover:text-white transition-colors"
                      title="Edit collection"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(col.id);
                        setDeleteName(col.name);
                      }}
                      className="p-1.5 rounded hover:bg-red-500/10 text-muted hover:text-red-400 transition-colors"
                      title="Delete collection"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 relative fade-in-up"
            style={{ backgroundColor: '#121212', border: '1px solid #242424', boxShadow: '0 25px 60px rgba(0,0,0,0.8)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
              <h3 className="text-sm font-semibold text-white">
                {editingCollection ? 'Edit Collection' : 'Create New Collection'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Collection Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Christopher Nolan Collection"
                  className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none"
                  style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">URL Slug *</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. nolan-collection"
                  className="w-full px-3 py-2 rounded-lg text-xs font-mono focus:outline-none"
                  style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short summary of this collection..."
                  className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none"
                  style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Cover Image URL</label>
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none"
                  style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Visibility</label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as 'PUBLIC' | 'PRIVATE')}
                    className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none"
                    style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="PRIVATE">Private</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      style={{ accentColor: '#D4AF37' }}
                    />
                    <span>Highlight on Home</span>
                  </label>
                </div>
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
                  <span>{editingCollection ? 'Save Changes' : 'Create Collection'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Collection"
        message={`Are you sure you want to delete "${deleteName}"? Titles inside will remain in the catalog.`}
        confirmLabel="Delete Collection"
        danger={true}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}


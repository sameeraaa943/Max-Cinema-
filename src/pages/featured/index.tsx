import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Star,
  Plus,
  GripVertical,
  Trash2,
  Film,
  Tv,
  Search,
  Check,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { featuredApi, moviesApi, tvShowsApi } from '../../services/api';
import { FeaturedItem, Movie, TVShow } from '../../types';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

// Sortable Item Component
function SortableFeaturedRow({
  item,
  onToggle,
  onRemove,
}: {
  item: FeaturedItem;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.7 : 1,
  };

  const title = item.movie?.title || item.tvShow?.title || 'Untitled';
  const poster = item.movie?.posterUrl || item.tvShow?.posterUrl;
  const rating = item.movie?.rating || item.tvShow?.rating;
  const isMovie = item.contentType === 'MOVIE';

  return (
    <div
      ref={setNodeRef}
      className="p-3 rounded-xl flex items-center gap-3 transition-colors card-hover mb-2 select-none"
      style={{
        ...style,
        backgroundColor: '#121212',
        border: '1px solid #242424',
      }}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-1 text-muted hover:text-white cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={16} />
      </button>

      {/* Poster */}
      <div className="w-10 h-14 rounded overflow-hidden flex-shrink-0 bg-[#1f1f1f] flex items-center justify-center">
        {poster ? (
          <img src={poster} alt="" className="w-full h-full object-cover" />
        ) : isMovie ? (
          <Film size={16} className="text-muted/50" />
        ) : (
          <Tv size={16} className="text-muted/50" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs text-white truncate">{title}</span>
          <span
            className="text-[10px] px-1.5 py-0.2 rounded font-mono uppercase font-semibold"
            style={
              isMovie
                ? { backgroundColor: 'rgba(212,175,55,0.12)', color: '#D4AF37' }
                : { backgroundColor: 'rgba(59,130,246,0.12)', color: '#60a5fa' }
            }
          >
            {isMovie ? 'Movie' : 'TV Show'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted mt-1">
          {rating && (
            <span className="flex items-center gap-1 text-amber-400 font-semibold">
              <Star size={10} fill="#facc15" />
              {rating.toFixed(1)}
            </span>
          )}
          <span>•</span>
          <span>Order #{item.displayOrder + 1}</span>
        </div>
      </div>

      {/* Enabled toggle */}
      <button
        onClick={() => onToggle(item.id)}
        className="px-2.5 py-1 rounded text-xs font-semibold transition-all"
        style={{
          backgroundColor: item.enabled ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
          color: item.enabled ? '#4ade80' : '#f87171',
          border: `1px solid ${item.enabled ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}
      >
        {item.enabled ? 'Active' : 'Disabled'}
      </button>

      {/* Remove button */}
      <button
        onClick={() => onRemove(item.id)}
        className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
        title="Remove from featured"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

export default function FeaturedPage() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'MOVIE' | 'TV_SHOW'>('MOVIE');
  const [modalSearch, setModalSearch] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Fetch featured items
  const { data: featuredData, isLoading } = useQuery({
    queryKey: ['featured-items'],
    queryFn: () => featuredApi.list(),
  });

  const featuredItems: FeaturedItem[] = featuredData?.data?.data || [];

  // Fetch search items for modal
  const { data: moviesSearchData } = useQuery({
    queryKey: ['modal-movies', modalSearch],
    queryFn: () => moviesApi.list({ search: modalSearch || undefined, limit: 10 }),
    enabled: isAddModalOpen && modalTab === 'MOVIE',
  });

  const { data: tvSearchData } = useQuery({
    queryKey: ['modal-tv', modalSearch],
    queryFn: () => tvShowsApi.list({ search: modalSearch || undefined, limit: 10 }),
    enabled: isAddModalOpen && modalTab === 'TV_SHOW',
  });

  const modalMovies: Movie[] = moviesSearchData?.data?.data?.items || [];
  const modalTVShows: TVShow[] = tvSearchData?.data?.data?.items || [];

  // Mutations
  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) => featuredApi.reorder(orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-items'] });
      toast.success('Display order saved');
    },
    onError: () => toast.error('Failed to reorder items'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => featuredApi.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-items'] });
      toast.success('Featured item status updated');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => featuredApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-items'] });
      toast.success('Removed from featured');
    },
    onError: () => toast.error('Failed to remove item'),
  });

  const addMutation = useMutation({
    mutationFn: (data: { contentType: string; movieId?: string; tvShowId?: string }) =>
      featuredApi.add(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-items'] });
      toast.success('Added to featured!');
      setIsAddModalOpen(false);
    },
    onError: (err: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((err as any).response?.data?.error || 'Failed to add to featured');
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = featuredItems.findIndex((i) => i.id === active.id);
      const newIndex = featuredItems.findIndex((i) => i.id === over.id);
      const newItems = arrayMove(featuredItems, oldIndex, newIndex);
      const orderedIds = newItems.map((i) => i.id);
      reorderMutation.mutate(orderedIds);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-cinzel tracking-wide flex items-center gap-2">
            <Star size={22} style={{ color: '#D4AF37' }} />
            <span>Featured Content</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Curate and order the marquee items highlighted at the top of the CineScope public homepage
          </p>
        </div>

        <button
          onClick={() => { setIsAddModalOpen(true); setModalSearch(''); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold btn-gold transition-all self-start sm:self-auto"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)',
            color: '#070707',
          }}
        >
          <Plus size={16} />
          <span>Add Featured Item</span>
        </button>
      </div>

      {/* Reorderable List */}
      {isLoading ? (
        <LoadingSkeleton lines={5} height="60px" />
      ) : featuredItems.length === 0 ? (
        <EmptyState
          title="No featured content"
          description="You haven't selected any movies or TV shows to feature yet. Featured items appear prominently on the public homepage."
          icon={Star}
          action={{
            label: 'Add First Item',
            onClick: () => setIsAddModalOpen(true),
          }}
        />
      ) : (
        <div>
          <div className="text-xs text-muted mb-3 flex items-center gap-1.5">
            <GripVertical size={14} />
            <span>Drag items vertically to reorder their appearance on the homepage</span>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={featuredItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {featuredItems.map((item) => (
                  <SortableFeaturedRow
                    key={item.id}
                    item={item}
                    onToggle={(id) => toggleMutation.mutate(id)}
                    onRemove={(id) => removeMutation.mutate(id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6 relative max-h-[85vh] flex flex-col fade-in-up"
            style={{ backgroundColor: '#121212', border: '1px solid #242424', boxShadow: '0 25px 60px rgba(0,0,0,0.8)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
              <h3 className="text-sm font-semibold text-white">Add Content to Featured</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-muted hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Type tabs */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setModalTab('MOVIE')}
                className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                style={{
                  backgroundColor: modalTab === 'MOVIE' ? 'rgba(212,175,55,0.15)' : '#0D0D0D',
                  color: modalTab === 'MOVIE' ? '#D4AF37' : '#8A8A8A',
                  border: modalTab === 'MOVIE' ? '1px solid #D4AF37' : '1px solid #242424',
                }}
              >
                <Film size={14} />
                <span>Movies</span>
              </button>
              <button
                onClick={() => setModalTab('TV_SHOW')}
                className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                style={{
                  backgroundColor: modalTab === 'TV_SHOW' ? 'rgba(59,130,246,0.15)' : '#0D0D0D',
                  color: modalTab === 'TV_SHOW' ? '#60a5fa' : '#8A8A8A',
                  border: modalTab === 'TV_SHOW' ? '1px solid #3b82f6' : '1px solid #242424',
                }}
              >
                <Tv size={14} />
                <span>TV Shows</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative mt-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder={modalTab === 'MOVIE' ? 'Search movies in catalog...' : 'Search TV shows in catalog...'}
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg text-xs focus:outline-none"
                style={{ backgroundColor: '#070707', border: '1px solid #242424', color: '#FFFFFF' }}
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto mt-4 divide-y divide-[#1f1f1f] max-h-72">
              {modalTab === 'MOVIE' ? (
                modalMovies.length === 0 ? (
                  <p className="text-center text-xs text-muted py-8">No movies found</p>
                ) : (
                  modalMovies.map((movie) => (
                    <div key={movie.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-11 rounded overflow-hidden bg-[#1f1f1f] flex-shrink-0">
                          {movie.posterUrl && <img src={movie.posterUrl} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-semibold text-white truncate">{movie.title}</div>
                          <div className="text-[10px] text-muted">{movie.rating ? `★ ${movie.rating}` : 'No rating'}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => addMutation.mutate({ contentType: 'MOVIE', movieId: movie.id })}
                        disabled={addMutation.isPending}
                        className="px-3 py-1.5 rounded text-xs font-semibold btn-gold flex-shrink-0"
                        style={{
                          background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)',
                          color: '#070707',
                        }}
                      >
                        Feature
                      </button>
                    </div>
                  ))
                )
              ) : modalTVShows.length === 0 ? (
                <p className="text-center text-xs text-muted py-8">No TV shows found</p>
              ) : (
                modalTVShows.map((show) => (
                  <div key={show.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-11 rounded overflow-hidden bg-[#1f1f1f] flex-shrink-0">
                        {show.posterUrl && <img src={show.posterUrl} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-white truncate">{show.title}</div>
                        <div className="text-[10px] text-muted">{show.rating ? `★ ${show.rating}` : 'No rating'}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => addMutation.mutate({ contentType: 'TV_SHOW', tvShowId: show.id })}
                      disabled={addMutation.isPending}
                      className="px-3 py-1.5 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex-shrink-0"
                    >
                      Feature
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

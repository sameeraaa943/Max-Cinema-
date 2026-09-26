import React, { useState } from 'react';
import { MessageSquare, Star, CheckCircle, Flag, Trash2, Loader2 } from 'lucide-react';
import { reviewsApi } from '../../services/api';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function ReviewsPage() {
  const queryClient = useQueryClient();
  const [statusTab, setStatusTab] = useState('ALL');
  const [page, setPage] = useState(1);

  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['reviews', statusTab, page],
    queryFn: async () => {
      const res = await reviewsApi.list({ status: statusTab === 'ALL' ? undefined : statusTab, page, limit: 20 });
      return res.data?.data || { reviews: [], total: 0 };
    },
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'flag' | 'delete' }) => {
      if (action === 'approve') return reviewsApi.approve(id);
      if (action === 'flag') return reviewsApi.flag(id);
      return reviewsApi.delete(id);
    },
    onSuccess: (_, { action }) => {
      toast.success(`Review ${action}d successfully`);
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  const renderStars = (rating: number) => {
    // rating is out of 10, convert to 5 stars
    const stars = Math.round(rating / 2);
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} fill={i < stars ? '#D4AF37' : 'none'} color={i < stars ? '#D4AF37' : '#242424'} />
        ))}
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    if (status === 'APPROVED') return '#4ade80';
    if (status === 'FLAGGED') return '#f87171';
    return '#fbbf24'; // PENDING
  };

  return (
    <div style={{ padding: '24px', color: '#fff', backgroundColor: '#070707', minHeight: '100vh' }}>
      <header style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <MessageSquare size={32} color="#D4AF37" />
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#fff' }}>Reviews & Ratings</h1>
          <p style={{ margin: 0, color: '#8A8A8A', fontSize: '14px' }}>Moderate user reviews across all content</p>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #242424', marginBottom: '24px' }}>
        {['ALL', 'PENDING', 'APPROVED', 'FLAGGED'].map(tab => (
          <button
            key={tab}
            onClick={() => { setStatusTab(tab); setPage(1); }}
            style={{
              background: 'none', border: 'none', color: statusTab === tab ? '#D4AF37' : '#8A8A8A',
              padding: '12px 16px', cursor: 'pointer', borderBottom: statusTab === tab ? '2px solid #D4AF37' : '2px solid transparent',
              fontWeight: statusTab === tab ? 'bold' : 'normal'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ backgroundColor: '#121212', borderRadius: '8px', border: '1px solid #242424', padding: '16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #242424', color: '#8A8A8A', fontSize: '12px' }}>
              <th style={{ padding: '12px' }}>User & Date</th>
              <th style={{ padding: '12px' }}>Content</th>
              <th style={{ padding: '12px' }}>Rating</th>
              <th style={{ padding: '12px' }}>Review</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}><Loader2 className="spin" /></td></tr>
            ) : reviewsData?.reviews?.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#8A8A8A' }}>No reviews found</td></tr>
            ) : (
              reviewsData?.reviews?.map((r: any) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #242424' }}>
                  <td style={{ padding: '12px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 'bold' }}>{r.user?.name || 'Unknown User'}</div>
                    <div style={{ fontSize: '12px', color: '#8A8A8A' }}>{new Date(r.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td style={{ padding: '12px', verticalAlign: 'top' }}>
                    <span style={{ fontSize: '12px', color: '#D4AF37', border: '1px solid #D4AF37', padding: '2px 6px', borderRadius: '4px', marginRight: '6px' }}>{r.contentType}</span>
                    {r.content?.title || r.contentId}
                  </td>
                  <td style={{ padding: '12px', verticalAlign: 'top' }}>
                    {renderStars(r.rating)}
                    <span style={{ fontSize: '12px', color: '#8A8A8A', marginLeft: '6px' }}>{r.rating}/10</span>
                  </td>
                  <td style={{ padding: '12px', maxWidth: '300px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>{r.title}</div>
                    <div style={{ fontSize: '13px', color: '#8A8A8A', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {r.body}
                    </div>
                  </td>
                  <td style={{ padding: '12px', verticalAlign: 'top' }}>
                    <span style={{ color: getStatusColor(r.status), background: `${getStatusColor(r.status)}1A`, padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                      {r.status || 'PENDING'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => actionMutation.mutate({ id: r.id, action: 'approve' })} title="Approve" style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer' }}>
                        <CheckCircle size={18} />
                      </button>
                      <button onClick={() => actionMutation.mutate({ id: r.id, action: 'flag' })} title="Flag" style={{ background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer' }}>
                        <Flag size={18} />
                      </button>
                      <button onClick={() => window.confirm('Delete review?') && actionMutation.mutate({ id: r.id, action: 'delete' })} title="Delete" style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

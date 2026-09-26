import React, { useState } from 'react';
import { Bell, Send, Trash2, Users, Crown, Plus, Loader2, Check, X } from 'lucide-react';
import { pushApi } from '../../services/api';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function PushNotificationsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetAudience, setTargetAudience] = useState('ALL');

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['push-notifications'],
    queryFn: async () => {
      const res = await pushApi.list();
      return res.data?.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => pushApi.create(data),
    onSuccess: () => {
      toast.success('Notification created successfully');
      queryClient.invalidateQueries({ queryKey: ['push-notifications'] });
      closeModal();
    },
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => pushApi.send(id),
    onSuccess: () => {
      toast.success('Notification sent successfully');
      queryClient.invalidateQueries({ queryKey: ['push-notifications'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => pushApi.delete(id),
    onSuccess: () => {
      toast.success('Notification deleted');
      queryClient.invalidateQueries({ queryKey: ['push-notifications'] });
    },
  });

  const openModal = () => {
    setTitle(''); setBody(''); setImageUrl(''); setTargetAudience('ALL');
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;
    createMutation.mutate({ title, body, imageUrl, targetAudience });
  };

  const getTargetColor = (target: string) => {
    if (target === 'PREMIUM') return '#D4AF37';
    if (target === 'FREE') return '#8A8A8A';
    return '#3b82f6'; // ALL
  };

  return (
    <div style={{ padding: '24px', color: '#fff', backgroundColor: '#070707', minHeight: '100vh' }}>
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Bell size={32} color="#D4AF37" />
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', color: '#fff' }}>Push Notifications</h1>
            <p style={{ margin: 0, color: '#8A8A8A', fontSize: '14px' }}>Send alerts to users' devices</p>
          </div>
        </div>
        <button onClick={openModal} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#D4AF37', color: '#000', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          <Plus size={18} /> New Notification
        </button>
      </header>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '48px' }}><Loader2 className="spin" size={32} /></div>
      ) : notificationsData?.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#121212', borderRadius: '8px', border: '1px dashed #242424', color: '#8A8A8A' }}>
          <Bell size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <p>No push notifications found. Create one to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {notificationsData.map((notif: any) => (
            <div key={notif.id} style={{ backgroundColor: '#121212', borderRadius: '8px', border: '1px solid #242424', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>{notif.title}</h3>
                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: `${getTargetColor(notif.targetAudience)}33`, color: getTargetColor(notif.targetAudience), border: `1px solid ${getTargetColor(notif.targetAudience)}` }}>
                    {notif.targetAudience}
                  </span>
                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: notif.status === 'SENT' ? 'rgba(74, 222, 128, 0.2)' : notif.status === 'FAILED' ? 'rgba(248, 113, 113, 0.2)' : '#242424', color: notif.status === 'SENT' ? '#4ade80' : notif.status === 'FAILED' ? '#f87171' : '#8A8A8A' }}>
                    {notif.status}
                  </span>
                </div>
                <p style={{ margin: '0 0 12px 0', color: '#8A8A8A', fontSize: '14px' }}>{notif.body}</p>
                <div style={{ fontSize: '12px', color: '#555', display: 'flex', gap: '16px' }}>
                  <span>Created: {new Date(notif.createdAt).toLocaleString()}</span>
                  {notif.status === 'SENT' && <span>Reached: ~{notif.sentCount || 0} users</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginLeft: '24px' }}>
                {notif.status === 'DRAFT' && (
                  <button 
                    onClick={() => {
                      if(window.confirm(`Send this notification to ${notif.targetAudience} users?`)) {
                        sendMutation.mutate(notif.id);
                      }
                    }} 
                    style={{ background: '#4ade80', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Send size={16} /> Send
                  </button>
                )}
                <button onClick={() => window.confirm('Delete this notification?') && deleteMutation.mutate(notif.id)} style={{ background: 'rgba(248, 113, 113, 0.1)', color: '#f87171', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#121212', padding: '24px', borderRadius: '12px', border: '1px solid #242424', width: '100%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0 }}>New Notification</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#8A8A8A', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Title</label>
                <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="New Movie Available!" style={{ width: '100%', background: '#070707', border: '1px solid #242424', padding: '10px', borderRadius: '6px', color: '#fff' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Body</label>
                <textarea required value={body} onChange={e => setBody(e.target.value)} placeholder="Watch the latest blockbuster now..." rows={3} style={{ width: '100%', background: '#070707', border: '1px solid #242424', padding: '10px', borderRadius: '6px', color: '#fff', resize: 'vertical' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Image URL (Optional)</label>
                <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', background: '#070707', border: '1px solid #242424', padding: '10px', borderRadius: '6px', color: '#fff' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Target Audience</label>
                <select value={targetAudience} onChange={e => setTargetAudience(e.target.value)} style={{ width: '100%', background: '#070707', border: '1px solid #242424', padding: '10px', borderRadius: '6px', color: '#fff' }}>
                  <option value="ALL">All Users</option>
                  <option value="PREMIUM">Premium Users Only</option>
                  <option value="FREE">Free Users Only</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={closeModal} style={{ padding: '10px 16px', background: '#242424', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={createMutation.isPending} style={{ padding: '10px 16px', background: '#D4AF37', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {createMutation.isPending ? 'Creating...' : 'Create Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

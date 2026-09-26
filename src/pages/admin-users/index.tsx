// File: src/pages/admin-users/index.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserPlus, Shield, Trash2, Key, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { adminUsersApi } from '../../services/api';

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

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ADMIN');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users-list'],
    queryFn: () => adminUsersApi.list().then(r => r.data?.data || []),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => adminUsersApi.create(data),
    onSuccess: () => {
      toast.success('Admin user created');
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      setModalOpen(false);
      setName(''); setEmail(''); setPassword('');
    },
    onError: () => toast.error('Failed to create admin user'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminUsersApi.delete(id),
    onSuccess: () => {
      toast.success('User deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
    },
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Users size={28} color="#D4AF37" />
          <div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, fontFamily: 'Cinzel, serif' }}>Admin User Management</h1>
            <p style={{ color: '#8A8A8A', fontSize: 13, marginTop: 2 }}>Role-based access control (RBAC) and credentials</p>
          </div>
        </div>
        <button style={btnGold} onClick={() => setModalOpen(true)}>
          <UserPlus size={16} /> New Admin
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Loader2 size={32} color="#D4AF37" style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : (
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #242424' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: '#8A8A8A', fontSize: 12 }}>NAME</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: '#8A8A8A', fontSize: 12 }}>EMAIL</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: '#8A8A8A', fontSize: 12 }}>ROLE</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: '#8A8A8A', fontSize: 12 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <td style={{ padding: '12px 16px', color: '#fff', fontWeight: 600, fontSize: 13 }}>{u.name}</td>
                  <td style={{ padding: '12px 16px', color: '#8A8A8A', fontSize: 13 }}>{u.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      background: u.role === 'SUPER_ADMIN' ? 'rgba(212,175,55,0.15)' : 'rgba(59,130,246,0.15)',
                      color: u.role === 'SUPER_ADMIN' ? '#D4AF37' : '#3b82f6',
                      borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => deleteMutation.mutate(u.id)}
                      disabled={u.role === 'SUPER_ADMIN'}
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '4px 8px', cursor: u.role === 'SUPER_ADMIN' ? 'not-allowed' : 'pointer', opacity: u.role === 'SUPER_ADMIN' ? 0.3 : 1 }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ ...cardStyle, width: '100%', maxWidth: 440, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>Add Admin User</h2>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: '#8A8A8A', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ color: '#8A8A8A', fontSize: 12, display: 'block', marginBottom: 4 }}>Full Name</label>
                <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" />
              </div>
              <div>
                <label style={{ color: '#8A8A8A', fontSize: 12, display: 'block', marginBottom: 4 }}>Email *</label>
                <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@cinescope.com" />
              </div>
              <div>
                <label style={{ color: '#8A8A8A', fontSize: 12, display: 'block', marginBottom: 4 }}>Password *</label>
                <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" />
              </div>
              <div>
                <label style={{ color: '#8A8A8A', fontSize: 12, display: 'block', marginBottom: 4 }}>Role</label>
                <select style={inputStyle} value={role} onChange={e => setRole(e.target.value)}>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="EDITOR">Editor</option>
                  <option value="ANALYTICS">Analytics Viewer</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setModalOpen(false)} style={{ ...btnGhost, flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button
                onClick={() => createMutation.mutate({ name, email, password, role })}
                disabled={!email || !password || createMutation.isPending}
                style={{ ...btnGold, flex: 1, justifyContent: 'center' }}
              >
                Create Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

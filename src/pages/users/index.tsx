import React, { useState } from 'react';
import { Users, UserCheck, Crown, Star, Trash2, ToggleLeft, ToggleRight, Search, Loader2 } from 'lucide-react';
import { publicUsersApi } from '../../services/api';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [premiumFilter, setPremiumFilter] = useState(false);
  const [page, setPage] = useState(1);

  const { data: statsData } = useQuery({
    queryKey: ['public-users-stats'],
    queryFn: async () => {
      const res = await publicUsersApi.stats();
      return res.data?.data || { total: 0, premium: 0, active: 0, new: 0 };
    },
  });

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['public-users', search, roleFilter, premiumFilter, page],
    queryFn: async () => {
      const res = await publicUsersApi.list({ search, role: roleFilter === 'ALL' ? undefined : roleFilter, isPremium: premiumFilter || undefined, page, limit: 10 });
      return res.data?.data || { users: [], total: 0 };
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => publicUsersApi.update(id, data),
    onSuccess: () => {
      toast.success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: ['public-users'] });
      queryClient.invalidateQueries({ queryKey: ['public-users-stats'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => publicUsersApi.delete(id),
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['public-users'] });
      queryClient.invalidateQueries({ queryKey: ['public-users-stats'] });
    },
  });

  const togglePremium = (id: string, current: boolean) => {
    updateMutation.mutate({ id, data: { isPremium: !current } });
  };

  const toggleActive = (id: string, current: boolean) => {
    updateMutation.mutate({ id, data: { isActive: !current } });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div style={{ padding: '24px', color: '#fff', backgroundColor: '#070707', minHeight: '100vh' }}>
      <header style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Users size={32} color="#D4AF37" />
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#fff' }}>User Accounts</h1>
          <p style={{ margin: 0, color: '#8A8A8A', fontSize: '14px' }}>Manage public user accounts and subscriptions</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#121212', padding: '16px', borderRadius: '8px', border: '1px solid #242424' }}>
          <div style={{ color: '#8A8A8A', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={14} /> Total Users</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{statsData?.total || 0}</div>
        </div>
        <div style={{ backgroundColor: '#121212', padding: '16px', borderRadius: '8px', border: '1px solid #242424' }}>
          <div style={{ color: '#8A8A8A', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><Crown size={14} color="#D4AF37" /> Premium Users</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#D4AF37' }}>{statsData?.premium || 0}</div>
        </div>
        <div style={{ backgroundColor: '#121212', padding: '16px', borderRadius: '8px', border: '1px solid #242424' }}>
          <div style={{ color: '#8A8A8A', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><UserCheck size={14} color="#4ade80" /> Active Users</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{statsData?.active || 0}</div>
        </div>
        <div style={{ backgroundColor: '#121212', padding: '16px', borderRadius: '8px', border: '1px solid #242424' }}>
          <div style={{ color: '#8A8A8A', fontSize: '12px' }}>New This Week</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{statsData?.new || 0}</div>
        </div>
      </div>

      <div style={{ backgroundColor: '#121212', borderRadius: '8px', border: '1px solid #242424', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} color="#8A8A8A" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ width: '100%', background: '#070707', border: '1px solid #242424', borderRadius: '8px', padding: '8px 12px 8px 40px', color: '#fff' }}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            style={{ background: '#070707', border: '1px solid #242424', borderRadius: '8px', padding: '8px 12px', color: '#fff' }}
          >
            <option value="ALL">All Roles</option>
            <option value="USER">User</option>
            <option value="MODERATOR">Moderator</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#070707', border: '1px solid #242424', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer' }}>
            <input type="checkbox" checked={premiumFilter} onChange={(e) => { setPremiumFilter(e.target.checked); setPage(1); }} />
            Premium Only
          </label>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #242424', color: '#8A8A8A', fontSize: '12px' }}>
              <th style={{ padding: '12px' }}>User</th>
              <th style={{ padding: '12px' }}>Role</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px' }}>Joined</th>
              <th style={{ padding: '12px' }}>Reviews</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}><Loader2 className="spin" /></td></tr>
            ) : usersData?.users?.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#8A8A8A' }}>No users found</td></tr>
            ) : (
              usersData?.users?.map((u: any) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #242424' }}>
                  <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#242424', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {u.name?.substring(0,2).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {u.name} {u.isPremium && <Star size={12} fill="#D4AF37" color="#D4AF37" />}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8A8A8A' }}>{u.email}</div>
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#242424', fontSize: '12px' }}>{u.role || 'USER'}</span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', background: u.isActive ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)', color: u.isActive ? '#4ade80' : '#f87171', fontSize: '12px' }}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{u.reviewsCount || 0}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => togglePremium(u.id, u.isPremium)} title="Toggle Premium" style={{ background: 'none', border: 'none', color: u.isPremium ? '#D4AF37' : '#8A8A8A', cursor: 'pointer' }}>
                        <Crown size={18} />
                      </button>
                      <button onClick={() => toggleActive(u.id, u.isActive)} title="Toggle Active" style={{ background: 'none', border: 'none', color: u.isActive ? '#4ade80' : '#8A8A8A', cursor: 'pointer' }}>
                        {u.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      </button>
                      <button onClick={() => handleDelete(u.id)} title="Delete" style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: '12px', color: '#8A8A8A' }}>Showing page {page}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '6px 12px', background: '#242424', border: 'none', color: '#fff', borderRadius: '4px', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
            <button onClick={() => setPage(p => p + 1)} style={{ padding: '6px 12px', background: '#242424', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  Key,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminUsersApi } from '../../services/api';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState('');

  // Create Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ADMIN');

  // Reset Password Form
  const [newPassword, setNewPassword] = useState('');

  // Fetch Admins
  const { data } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminUsersApi.list(),
  });

  const admins = data?.data?.data || [];

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (userData: any) => adminUsersApi.create(userData),
    onSuccess: () => {
      toast.success('Admin user created');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsCreateOpen(false);
      setName('');
      setEmail('');
      setPassword('');
    },
    onError: () => toast.error('Failed to create admin user'),
  });

  // Reset Password Mutation
  const resetMutation = useMutation({
    mutationFn: ({ id, pass }: { id: string; pass: string }) =>
      adminUsersApi.resetPassword(id, { password: pass }),
    onSuccess: () => {
      toast.success('Password updated successfully');
      setIsResetOpen(false);
      setNewPassword('');
    },
    onError: () => toast.error('Failed to reset password'),
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminUsersApi.delete(id),
    onSuccess: () => {
      toast.success('Admin removed');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Email and password are required');
      return;
    }
    createMutation.mutate({ name, email, password, role });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-cinzel tracking-wide">Admin User Management</h1>
          <p className="text-xs text-muted mt-1">
            Manage operator accounts, privileged access, and credentials for CineScope Control.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold btn-gold transition-all self-start sm:self-auto"
          style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)', color: '#070707' }}
        >
          <Plus size={16} />
          <span>Add Admin User</span>
        </button>
      </div>

      {/* Users Table */}
      <div
        className="rounded-xl overflow-hidden border border-[#242424]"
        style={{ backgroundColor: '#121212' }}
      >
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#242424] bg-[#0D0D0D] text-[11px] text-muted uppercase">
              <th className="py-3 px-4">Name & Email</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Created</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e1e1e]">
            {admins.map((adm: any) => (
              <tr key={adm.id} className="hover:bg-white/[0.02]">
                <td className="py-3 px-4">
                  <div className="font-semibold text-white">{adm.name || 'Admin'}</div>
                  <div className="text-muted font-mono text-[11px]">{adm.email}</div>
                </td>
                <td className="py-3 px-4">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold"
                    style={{
                      backgroundColor: adm.role === 'SUPER_ADMIN' ? 'rgba(212,175,55,0.15)' : 'rgba(59,130,246,0.15)',
                      color: adm.role === 'SUPER_ADMIN' ? '#D4AF37' : '#60a5fa',
                      border: `1px solid ${adm.role === 'SUPER_ADMIN' ? 'rgba(212,175,55,0.3)' : 'rgba(59,130,246,0.3)'}`,
                    }}
                  >
                    {adm.role}
                  </span>
                </td>
                <td className="py-3 px-4 text-muted">{new Date(adm.createdAt).toLocaleDateString()}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setSelectedAdminId(adm.id);
                        setIsResetOpen(true);
                      }}
                      className="p-1.5 rounded hover:bg-white/5 text-muted hover:text-gold"
                      title="Reset Password"
                    >
                      <Key size={13} />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(adm.id)}
                      className="p-1.5 rounded hover:bg-red-500/10 text-muted hover:text-red-400"
                      title="Delete Admin"
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

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl p-6 bg-[#121212] border border-[#242424]">
            <h2 className="text-lg font-bold text-white font-cinzel">Create Admin Operator</h2>
            <form onSubmit={handleCreate} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-muted font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-muted font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-muted font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-muted font-medium mb-1">Privilege Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white focus:outline-none"
                >
                  <option value="ADMIN">ADMIN (Operator)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Owner / Full Access)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#242424]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-lg font-semibold btn-gold"
                  style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)', color: '#070707' }}
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl p-6 bg-[#121212] border border-[#242424]">
            <h2 className="text-lg font-bold text-white font-cinzel">Reset Admin Password</h2>
            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-muted font-medium mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#242424]">
                <button
                  type="button"
                  onClick={() => setIsResetOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={resetMutation.isPending || !newPassword}
                  onClick={() => resetMutation.mutate({ id: selectedAdminId, pass: newPassword })}
                  className="px-4 py-2 rounded-lg font-semibold btn-gold"
                  style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)', color: '#070707' }}
                >
                  Set Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { DollarSign, Crown, Users, TrendingUp, Plus, Edit2, Trash2, Check, X, Loader2 } from 'lucide-react';
import { monetizationApi } from '../../services/api';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function MonetizationPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [period, setPeriod] = useState('MONTHLY');
  const [isActive, setIsActive] = useState(true);
  const [features, setFeatures] = useState<string[]>(['']);

  const { data: statsData } = useQuery({
    queryKey: ['monetization-stats'],
    queryFn: async () => {
      const res = await monetizationApi.getStats();
      return res.data?.data || { premiumUsers: 0, conversionRate: 0, estimatedMrr: 0, estimatedArr: 0 };
    },
  });

  const { data: plansData, isLoading } = useQuery({
    queryKey: ['monetization-plans'],
    queryFn: async () => {
      const res = await monetizationApi.getPlans();
      return res.data?.data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => editingPlan ? monetizationApi.updatePlan(editingPlan.id, data) : monetizationApi.createPlan(data),
    onSuccess: () => {
      toast.success(`Plan ${editingPlan ? 'updated' : 'created'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['monetization-plans'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => monetizationApi.deletePlan(id),
    onSuccess: () => {
      toast.success('Plan deleted');
      queryClient.invalidateQueries({ queryKey: ['monetization-plans'] });
    },
  });

  const openModal = (plan?: any) => {
    if (plan) {
      setEditingPlan(plan);
      setName(plan.name);
      setPrice(plan.price);
      setCurrency(plan.currency || 'USD');
      setPeriod(plan.period || 'MONTHLY');
      setIsActive(plan.isActive);
      setFeatures(plan.features?.length ? plan.features : ['']);
    } else {
      setEditingPlan(null);
      setName('');
      setPrice(0);
      setCurrency('USD');
      setPeriod('MONTHLY');
      setIsActive(true);
      setFeatures(['']);
    }
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFeatures = features.filter(f => f.trim() !== '');
    if (!name || price < 0 || cleanFeatures.length === 0) return;
    saveMutation.mutate({ name, price, currency, period, isActive, features: cleanFeatures });
  };

  return (
    <div style={{ padding: '24px', color: '#fff', backgroundColor: '#070707', minHeight: '100vh' }}>
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <DollarSign size={32} color="#D4AF37" />
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', color: '#fff' }}>Monetization Center</h1>
            <p style={{ margin: 0, color: '#8A8A8A', fontSize: '14px' }}>Manage subscription plans and revenue</p>
          </div>
        </div>
        <button onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#D4AF37', color: '#000', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          <Plus size={18} /> New Plan
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: '#121212', padding: '16px', borderRadius: '8px', border: '1px solid #242424' }}>
          <div style={{ color: '#8A8A8A', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><Crown size={14} color="#D4AF37" /> Premium Users</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px' }}>{statsData?.premiumUsers?.toLocaleString() || 0}</div>
        </div>
        <div style={{ backgroundColor: '#121212', padding: '16px', borderRadius: '8px', border: '1px solid #242424' }}>
          <div style={{ color: '#8A8A8A', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={14} /> Conversion Rate</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px' }}>{statsData?.conversionRate || 0}%</div>
        </div>
        <div style={{ backgroundColor: '#121212', padding: '16px', borderRadius: '8px', border: '1px solid #242424' }}>
          <div style={{ color: '#8A8A8A', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><TrendingUp size={14} color="#4ade80" /> Estimated MRR</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px', color: '#4ade80' }}>${statsData?.estimatedMrr?.toLocaleString() || 0}</div>
        </div>
        <div style={{ backgroundColor: '#121212', padding: '16px', borderRadius: '8px', border: '1px solid #242424' }}>
          <div style={{ color: '#8A8A8A', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><DollarSign size={14} /> Estimated ARR</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px' }}>${statsData?.estimatedArr?.toLocaleString() || 0}</div>
        </div>
      </div>

      <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Subscription Plans</h2>
      
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '48px' }}><Loader2 className="spin" size={32} /></div>
      ) : plansData?.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#121212', borderRadius: '8px', border: '1px dashed #242424', color: '#8A8A8A' }}>
          <DollarSign size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <p>No subscription plans found. Create one to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {plansData.map((plan: any) => (
            <div key={plan.id} style={{ backgroundColor: '#121212', borderRadius: '12px', border: `1px solid ${plan.isActive ? '#D4AF37' : '#242424'}`, overflow: 'hidden', position: 'relative' }}>
              {!plan.isActive && <div style={{ position: 'absolute', top: 0, right: 0, background: '#242424', fontSize: '10px', padding: '4px 8px', borderBottomLeftRadius: '8px' }}>INACTIVE</div>}
              <div style={{ padding: '24px', borderBottom: '1px solid #242424' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>{plan.name}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#D4AF37' }}>
                    {plan.price === 0 ? 'Free' : `${plan.currency === 'EUR' ? '€' : plan.currency === 'GBP' ? '£' : '$'}${plan.price}`}
                  </span>
                  {plan.price > 0 && <span style={{ color: '#8A8A8A' }}>/{plan.period.toLowerCase()}</span>}
                </div>
              </div>
              <div style={{ padding: '24px' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {plan.features?.map((f: string, i: number) => (
                    <li key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '14px' }}>
                      <Check size={16} color="#D4AF37" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => openModal(plan)} style={{ flex: 1, padding: '10px', background: '#242424', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    <Edit2 size={16} /> Edit
                  </button>
                  <button onClick={() => window.confirm('Delete plan?') && deleteMutation.mutate(plan.id)} style={{ padding: '10px', background: 'rgba(248, 113, 113, 0.1)', color: '#f87171', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#121212', padding: '24px', borderRadius: '12px', border: '1px solid #242424', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0 }}>{editingPlan ? 'Edit Plan' : 'New Plan'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#8A8A8A', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Plan Name</label>
                <input required value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', background: '#070707', border: '1px solid #242424', padding: '10px', borderRadius: '6px', color: '#fff' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Price</label>
                  <input type="number" step="0.01" min="0" required value={price} onChange={e => setPrice(Number(e.target.value))} style={{ width: '100%', background: '#070707', border: '1px solid #242424', padding: '10px', borderRadius: '6px', color: '#fff' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Currency</label>
                  <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ width: '100%', background: '#070707', border: '1px solid #242424', padding: '10px', borderRadius: '6px', color: '#fff' }}>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Period</label>
                  <select value={period} onChange={e => setPeriod(e.target.value)} style={{ width: '100%', background: '#070707', border: '1px solid #242424', padding: '10px', borderRadius: '6px', color: '#fff' }}>
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="LIFETIME">Lifetime</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                  Plan is Active (visible to users)
                </label>
              </div>

              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '14px' }}>
                  Features
                  <button type="button" onClick={() => setFeatures([...features, ''])} style={{ background: 'none', border: 'none', color: '#D4AF37', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Plus size={14} /> Add Feature
                  </button>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px' }}>
                      <input value={f} onChange={e => { const newF = [...features]; newF[i] = e.target.value; setFeatures(newF); }} style={{ flex: 1, background: '#070707', border: '1px solid #242424', padding: '8px', borderRadius: '6px', color: '#fff' }} placeholder="e.g. 4K Streaming" />
                      {features.length > 1 && (
                        <button type="button" onClick={() => setFeatures(features.filter((_, idx) => idx !== i))} style={{ background: '#242424', border: 'none', color: '#f87171', padding: '0 12px', borderRadius: '6px', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={closeModal} style={{ padding: '10px 16px', background: '#242424', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saveMutation.isPending} style={{ padding: '10px 16px', background: '#D4AF37', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {saveMutation.isPending ? 'Saving...' : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

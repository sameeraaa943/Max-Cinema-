import React, { useState } from 'react';
import { Globe, Plus, Edit2, Trash2, CheckCircle, Loader2, Flag, X } from 'lucide-react';
import { languagesApi } from '../../services/api';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function LanguagesPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLang, setEditingLang] = useState<any>(null);

  // Form
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [nativeName, setNativeName] = useState('');
  const [rtl, setRtl] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);

  const { data: languages = [], isLoading } = useQuery({
    queryKey: ['languages'],
    queryFn: async () => {
      const res = await languagesApi.list();
      return res.data?.data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => editingLang ? languagesApi.update(editingLang.id, data) : languagesApi.create(data),
    onSuccess: () => {
      toast.success(`Language ${editingLang ? 'updated' : 'added'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['languages'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => languagesApi.delete(id),
    onSuccess: () => {
      toast.success('Language deleted');
      queryClient.invalidateQueries({ queryKey: ['languages'] });
    },
  });

  const openModal = (lang?: any) => {
    if (lang) {
      setEditingLang(lang);
      setCode(lang.code); setName(lang.name); setNativeName(lang.nativeName);
      setRtl(lang.rtl); setIsDefault(lang.isDefault); setIsEnabled(lang.isEnabled);
    } else {
      setEditingLang(null);
      setCode(''); setName(''); setNativeName('');
      setRtl(false); setIsDefault(false); setIsEnabled(true);
    }
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ code, name, nativeName, rtl, isDefault, isEnabled });
  };

  const getFlagEmoji = (code: string) => {
    const flags: Record<string, string> = {
      en: '🇺🇸', si: '🇱🇰', ta: '🇮🇳', hi: '🇮🇳', ar: '🇸🇦', fr: '🇫🇷', de: '🇩🇪', es: '🇪🇸'
    };
    return flags[code.toLowerCase()] || '🌐';
  };

  return (
    <div style={{ padding: '24px', color: '#fff', backgroundColor: '#070707', minHeight: '100vh' }}>
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Globe size={32} color="#D4AF37" />
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', color: '#fff' }}>Languages & Translations</h1>
            <p style={{ margin: 0, color: '#8A8A8A', fontSize: '14px' }}>Manage supported languages for the platform</p>
          </div>
        </div>
        <button onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#D4AF37', color: '#000', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          <Plus size={18} /> Add Language
        </button>
      </header>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '48px' }}><Loader2 className="spin" size={32} /></div>
      ) : languages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#121212', borderRadius: '8px', border: '1px dashed #242424', color: '#8A8A8A' }}>
          <Globe size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <p>No languages configured yet. Add one to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', marginBottom: '48px' }}>
          {languages.map((lang: any) => (
            <div key={lang.id} style={{ backgroundColor: '#121212', borderRadius: '12px', border: `1px solid ${lang.isDefault ? '#D4AF37' : '#242424'}`, padding: '20px', position: 'relative', opacity: lang.isEnabled ? 1 : 0.6 }}>
              {lang.isDefault && <div style={{ position: 'absolute', top: -1, right: 16, background: '#D4AF37', color: '#000', fontSize: '10px', padding: '4px 8px', borderBottomLeftRadius: '4px', borderBottomRightRadius: '4px', fontWeight: 'bold' }}>DEFAULT</div>}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '32px' }}>{getFlagEmoji(lang.code)}</div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {lang.name}
                    <span style={{ fontSize: '10px', background: '#242424', padding: '2px 6px', borderRadius: '4px' }}>{lang.code.toUpperCase()}</span>
                  </h3>
                  <div style={{ color: '#8A8A8A', fontSize: '14px' }}>{lang.nativeName}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {lang.rtl && <span style={{ fontSize: '10px', border: '1px solid #4ade80', color: '#4ade80', padding: '2px 6px', borderRadius: '4px' }}>RTL</span>}
                <span style={{ fontSize: '10px', border: `1px solid ${lang.isEnabled ? '#4ade80' : '#8A8A8A'}`, color: lang.isEnabled ? '#4ade80' : '#8A8A8A', padding: '2px 6px', borderRadius: '4px' }}>
                  {lang.isEnabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => openModal(lang)} style={{ flex: 1, padding: '8px', background: '#242424', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <Edit2 size={16} /> Edit
                </button>
                <button onClick={() => window.confirm('Delete this language?') && deleteMutation.mutate(lang.id)} disabled={lang.isDefault} style={{ padding: '8px', background: lang.isDefault ? '#242424' : 'rgba(248, 113, 113, 0.1)', color: lang.isDefault ? '#555' : '#f87171', border: 'none', borderRadius: '6px', cursor: lang.isDefault ? 'not-allowed' : 'pointer' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ backgroundColor: '#121212', borderRadius: '8px', border: '1px solid #242424', padding: '24px' }}>
        <h3 style={{ margin: '0 0 12px 0' }}>Content Translations</h3>
        <p style={{ color: '#8A8A8A', fontSize: '14px', margin: 0 }}>
          Use the Movies and TV Shows edit pages to add translations for individual content items. The system will automatically serve the appropriate language based on the user's preference.
        </p>
      </div>

      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#121212', padding: '24px', borderRadius: '12px', border: '1px solid #242424', width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0 }}>{editingLang ? 'Edit Language' : 'Add Language'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#8A8A8A', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Language Code (e.g. 'en', 'fr')</label>
                <input required value={code} onChange={e => setCode(e.target.value)} disabled={!!editingLang} style={{ width: '100%', background: '#070707', border: '1px solid #242424', padding: '10px', borderRadius: '6px', color: '#fff', opacity: editingLang ? 0.5 : 1 }} />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Name (English)</label>
                <input required value={name} onChange={e => setName(e.target.value)} placeholder="French" style={{ width: '100%', background: '#070707', border: '1px solid #242424', padding: '10px', borderRadius: '6px', color: '#fff' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Native Name</label>
                <input required value={nativeName} onChange={e => setNativeName(e.target.value)} placeholder="Français" style={{ width: '100%', background: '#070707', border: '1px solid #242424', padding: '10px', borderRadius: '6px', color: '#fff' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  <input type="checkbox" checked={rtl} onChange={e => setRtl(e.target.checked)} />
                  Right-to-Left (RTL)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  <input type="checkbox" checked={isEnabled} onChange={e => setIsEnabled(e.target.checked)} />
                  Enabled
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} />
                  Set as Default Language
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={closeModal} style={{ padding: '10px 16px', background: '#242424', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saveMutation.isPending} style={{ padding: '10px 16px', background: '#D4AF37', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {saveMutation.isPending ? 'Saving...' : 'Save Language'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

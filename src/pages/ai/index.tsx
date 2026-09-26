// File: src/pages/ai/index.tsx
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Sparkles, Wand2, CheckCircle, AlertTriangle, Globe, Film, Star, TrendingUp, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { aiApi } from '../../services/api';

const cardStyle: React.CSSProperties = { background: '#121212', border: '1px solid #242424', borderRadius: 12, padding: 24 };
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

export default function AiPage() {
  const [tab, setTab] = useState<'METADATA' | 'REVIEW' | 'CURATION' | 'TRANSLATE'>('METADATA');

  // Metadata gen state
  const [title, setTitle] = useState('');
  const [rawText, setRawText] = useState('');
  const [generatedMeta, setGeneratedMeta] = useState<any>(null);

  // Translate state
  const [sourceText, setSourceText] = useState('');
  const [targetLang, setTargetLang] = useState('si');
  const [translatedText, setTranslatedText] = useState('');

  const generateMetaMutation = useMutation({
    mutationFn: () => aiApi.generateMetadata({ title, rawText }),
    onSuccess: (res) => {
      setGeneratedMeta(res.data?.data || null);
      toast.success('Metadata generated!');
    },
    onError: () => toast.error('Failed to generate metadata'),
  });

  const translateMutation = useMutation({
    mutationFn: () => aiApi.translate({ text: sourceText, targetLanguage: targetLang }),
    onSuccess: (res) => {
      setTranslatedText(res.data?.data?.translatedText || '');
      toast.success('Translation complete!');
    },
    onError: () => toast.error('Failed to translate'),
  });

  const { data: featuredSuggestions = [] } = useQuery({
    queryKey: ['ai-featured-suggestions'],
    queryFn: () => aiApi.getFeaturedSuggestions().then(r => r.data?.data || []),
    enabled: tab === 'CURATION',
  });

  const { data: trendingSuggestions = [] } = useQuery({
    queryKey: ['ai-trending-suggestions'],
    queryFn: () => aiApi.getTrendingSuggestions().then(r => r.data?.data || []),
    enabled: tab === 'CURATION',
  });

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Sparkles size={28} color="#D4AF37" />
        <div>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, fontFamily: 'Cinzel, serif' }}>AI Content Assistant</h1>
          <p style={{ color: '#8A8A8A', fontSize: 13, marginTop: 2 }}>Automated metadata generation, quality audits, and translations</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #242424', paddingBottom: 12 }}>
        {[
          { id: 'METADATA', label: 'Metadata Generator', icon: <Wand2 size={15} /> },
          { id: 'CURATION', label: 'Smart Curation', icon: <Star size={15} /> },
          { id: 'TRANSLATE', label: 'Translator', icon: <Globe size={15} /> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            style={{
              background: tab === t.id ? 'rgba(212,175,55,0.12)' : 'transparent',
              color: tab === t.id ? '#D4AF37' : '#8A8A8A',
              border: `1px solid ${tab === t.id ? '#D4AF37' : 'transparent'}`,
              borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600,
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'METADATA' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={cardStyle}>
            <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Input Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ color: '#8A8A8A', fontSize: 12, display: 'block', marginBottom: 4 }}>Movie / TV Title *</label>
                <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Interstellar" />
              </div>
              <div>
                <label style={{ color: '#8A8A8A', fontSize: 12, display: 'block', marginBottom: 4 }}>Raw Plot / Description / Notes</label>
                <textarea style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }} value={rawText} onChange={e => setRawText(e.target.value)} placeholder="Paste any rough plot description..." />
              </div>
              <button
                style={{ ...btnGold, justifyContent: 'center', marginTop: 8 }}
                onClick={() => generateMetaMutation.mutate()}
                disabled={!title || generateMetaMutation.isPending}
              >
                {generateMetaMutation.isPending ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Wand2 size={15} />}
                Generate Metadata
              </button>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>AI Generated Results</h2>
            {!generatedMeta ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#8A8A8A' }}>
                <Wand2 size={36} color="#242424" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: 13 }}>Fill in a title and click Generate Metadata to preview AI suggestions.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ color: '#8A8A8A', fontSize: 11 }}>TAGLINE</label>
                  <div style={{ color: '#D4AF37', fontWeight: 600, fontSize: 14 }}>{generatedMeta.tagline || '—'}</div>
                </div>
                <div>
                  <label style={{ color: '#8A8A8A', fontSize: 11 }}>SEO DESCRIPTION</label>
                  <p style={{ color: '#fff', fontSize: 13, background: '#0a0a0a', padding: 10, borderRadius: 6 }}>{generatedMeta.description || '—'}</p>
                </div>
                <div>
                  <label style={{ color: '#8A8A8A', fontSize: 11 }}>SUGGESTED GENRES</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {(generatedMeta.genres || []).map((g: string) => (
                      <span key={g} style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{g}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'CURATION' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Star size={18} color="#D4AF37" />
              <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>AI Suggested Featured Content</h2>
            </div>
            {featuredSuggestions.length === 0 ? (
              <p style={{ color: '#8A8A8A', fontSize: 13 }}>No suggestions at this moment.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {featuredSuggestions.map((item: any) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a0a0a', padding: 12, borderRadius: 8, border: '1px solid #242424' }}>
                    <div>
                      <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{item.title}</div>
                      <div style={{ color: '#8A8A8A', fontSize: 11 }}>Score: {item.score || item.rating} ★</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <TrendingUp size={18} color="#D4AF37" />
              <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>AI Suggested Trending Content</h2>
            </div>
            {trendingSuggestions.length === 0 ? (
              <p style={{ color: '#8A8A8A', fontSize: 13 }}>No suggestions at this moment.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {trendingSuggestions.map((item: any) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a0a0a', padding: 12, borderRadius: 8, border: '1px solid #242424' }}>
                    <div>
                      <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{item.title}</div>
                      <div style={{ color: '#8A8A8A', fontSize: 11 }}>Score: {item.score || item.rating} ★</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'TRANSLATE' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={cardStyle}>
            <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Source Content (English)</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ color: '#8A8A8A', fontSize: 12, display: 'block', marginBottom: 4 }}>Target Language</label>
                <select style={{ ...inputStyle }} value={targetLang} onChange={e => setTargetLang(e.target.value)}>
                  <option value="si">Sinhala (සිංහල)</option>
                  <option value="ta">Tamil (தமிழ்)</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                  <option value="ar">Arabic (العربية)</option>
                  <option value="fr">French (Français)</option>
                  <option value="de">German (Deutsch)</option>
                  <option value="es">Spanish (Español)</option>
                </select>
              </div>
              <div>
                <label style={{ color: '#8A8A8A', fontSize: 12, display: 'block', marginBottom: 4 }}>Source Text *</label>
                <textarea style={{ ...inputStyle, minHeight: 140, resize: 'vertical' }} value={sourceText} onChange={e => setSourceText(e.target.value)} placeholder="Paste description or title to translate..." />
              </div>
              <button
                style={{ ...btnGold, justifyContent: 'center' }}
                onClick={() => translateMutation.mutate()}
                disabled={!sourceText || translateMutation.isPending}
              >
                {translateMutation.isPending ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Globe size={15} />}
                Translate
              </button>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Translated Output</h2>
            {!translatedText ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#8A8A8A' }}>
                <Globe size={36} color="#242424" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: 13 }}>Translate content into Sinhala, Tamil, Hindi, Arabic or European languages.</p>
              </div>
            ) : (
              <div>
                <textarea readOnly style={{ ...inputStyle, minHeight: 180, resize: 'vertical', background: '#0a0a0a' }} value={translatedText} />
                <button style={{ ...btnGhost, marginTop: 12 }} onClick={() => { navigator.clipboard.writeText(translatedText); toast.success('Copied!'); }}>Copy Translation</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

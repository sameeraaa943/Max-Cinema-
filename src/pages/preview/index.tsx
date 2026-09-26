// File: src/pages/preview/index.tsx
import { useState } from 'react';
import { Monitor, Tablet, Smartphone, ExternalLink, RefreshCw } from 'lucide-react';

const PUBLIC_URL = 'https://cinescopecodespactor.netlify.app';

type Viewport = 'desktop' | 'tablet' | 'mobile';

const VIEWPORTS: { id: Viewport; label: string; icon: React.ReactNode; width: string; height: string; radius: number }[] = [
  { id: 'desktop', label: 'Desktop', icon: <Monitor size={16} />, width: '100%', height: 'calc(100vh - 240px)', radius: 8 },
  { id: 'tablet',  label: 'Tablet',  icon: <Tablet size={16} />,  width: '768px',  height: '900px', radius: 12 },
  { id: 'mobile',  label: 'Mobile',  icon: <Smartphone size={16} />, width: '375px', height: '812px', radius: 24 },
];

export default function PreviewPage() {
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [iframeKey, setIframeKey] = useState(0);

  const vp = VIEWPORTS.find(v => v.id === viewport)!;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Monitor size={28} color="#D4AF37" />
          <div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, fontFamily: 'Cinzel, serif' }}>Site Preview</h1>
            <p style={{ color: '#8A8A8A', fontSize: 13, marginTop: 2 }}>Preview the public CineScope website</p>
          </div>
        </div>
        <a
          href={PUBLIC_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ background: 'linear-gradient(135deg, #D4AF37, #C5A028)', color: '#070707', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
        >
          <ExternalLink size={14} /> Open in New Tab
        </a>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', background: '#121212', border: '1px solid #242424', borderRadius: 8, overflow: 'hidden' }}>
          {VIEWPORTS.map(v => (
            <button
              key={v.id}
              onClick={() => setViewport(v.id)}
              style={{
                background: viewport === v.id ? 'rgba(212,175,55,0.15)' : 'transparent',
                color: viewport === v.id ? '#D4AF37' : '#8A8A8A',
                border: 'none',
                borderRight: '1px solid #242424',
                padding: '8px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: viewport === v.id ? 700 : 400,
              }}
            >
              {v.icon} {v.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIframeKey(k => k + 1)}
          style={{ background: '#121212', border: '1px solid #242424', color: '#8A8A8A', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: '#D4AF37', fontSize: 12 }}>
        ⚠️ Preview may be blocked by the site's X-Frame-Options policy. Click <strong>Open in New Tab</strong> to view the live site.
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: vp.width,
          height: vp.height,
          borderRadius: vp.radius,
          overflow: 'hidden',
          border: '1px solid #242424',
          background: '#121212',
          boxShadow: viewport !== 'desktop' ? '0 20px 60px rgba(0,0,0,0.5)' : 'none',
          transition: 'all 0.3s ease',
        }}>
          <iframe
            key={iframeKey}
            src={PUBLIC_URL}
            title="CineScope Preview"
            allow="*"
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          />
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <span style={{ color: '#242424', fontSize: 12 }}>{PUBLIC_URL}</span>
      </div>
    </div>
  );
}

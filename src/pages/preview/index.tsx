// File: src/pages/preview/index.tsx
import React, { useState, useCallback } from 'react';
import { Monitor, Tablet, Smartphone, ExternalLink, RefreshCw } from 'lucide-react';

const PUBLIC_SITE_URL = 'https://cinescopecodespactor.netlify.app';

type Viewport = 'desktop' | 'tablet' | 'mobile';

const VIEWPORTS: { id: Viewport; label: string; icon: React.ReactNode; width: number | null; height: number | null; borderRadius: number }[] = [
  { id: 'desktop', label: 'Desktop', icon: <Monitor size={16} />, width: null, height: null, borderRadius: 8 },
  { id: 'tablet', label: 'Tablet', icon: <Tablet size={16} />, width: 768, height: 1024, borderRadius: 12 },
  { id: 'mobile', label: 'Mobile', icon: <Smartphone size={16} />, width: 375, height: 812, borderRadius: 28 },
];

export default function PreviewPage() {
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [iframeKey, setIframeKey] = useState(0);
  const refresh = useCallback(() => setIframeKey(k => k + 1), []);

  const current = VIEWPORTS.find(v => v.id === viewport)!;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Monitor size={20} style={{ color: '#D4AF37' }} />
          <div>
            <h1 className="text-xl font-bold text-white font-cinzel tracking-wide">Site Preview</h1>
            <p className="text-xs" style={{ color: '#8A8A8A' }}>Live preview of your public CineScope site</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Viewport switcher */}
          <div className="flex gap-1 rounded-lg p-1" style={{ backgroundColor: '#121212', border: '1px solid #242424' }}>
            {VIEWPORTS.map(v => (
              <button key={v.id} onClick={() => setViewport(v.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all"
                style={{ backgroundColor: viewport === v.id ? '#D4AF37' : 'transparent', color: viewport === v.id ? '#070707' : '#8A8A8A' }}>
                {v.icon} {v.label}
              </button>
            ))}
          </div>
          <button onClick={refresh} className="p-2 rounded-lg" style={{ backgroundColor: '#121212', border: '1px solid #242424', color: '#8A8A8A' }} title="Refresh">
            <RefreshCw size={16} />
          </button>
          <a href={PUBLIC_SITE_URL} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
            style={{ backgroundColor: '#121212', border: '1px solid #242424', color: '#D4AF37' }}>
            <ExternalLink size={14} /> Open Site
          </a>
        </div>
      </div>

      {/* Notice */}
      <div className="flex-shrink-0 mb-3 px-4 py-2 rounded-lg text-xs" style={{ backgroundColor: '#1A1500', border: '1px solid #2A2500', color: '#D4AF37' }}>
        ⚠️ Preview may be blocked by the site's security headers. Use <strong>Open Site</strong> to view the live site in a new tab.
      </div>

      {/* Preview Container */}
      <div className="flex-1 flex items-start justify-center overflow-auto" style={{ minHeight: 0 }}>
        {current.width === null ? (
          /* Desktop: full width */
          <div className="w-full h-full rounded-xl overflow-hidden" style={{ border: '1px solid #242424' }}>
            <iframe
              key={iframeKey}
              src={PUBLIC_SITE_URL}
              title="CineScope Preview"
              className="w-full h-full"
              style={{ border: 'none', minHeight: 600 }}
              allow="*"
            />
          </div>
        ) : (
          /* Tablet / Mobile */
          <div className="flex-shrink-0 overflow-hidden shadow-2xl" style={{
            width: current.width,
            height: current.height!,
            borderRadius: current.borderRadius,
            border: `8px solid #242424`,
            position: 'relative',
          }}>
            {viewport === 'mobile' && (
              <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 80, height: 5, borderRadius: 3, backgroundColor: '#333', zIndex: 10 }} />
            )}
            <iframe
              key={iframeKey}
              src={PUBLIC_SITE_URL}
              title="CineScope Preview"
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              allow="*"
            />
          </div>
        )}
      </div>

      {/* URL bar */}
      <div className="flex-shrink-0 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#8A8A8A' }}>
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4ADE80' }} />
        <span className="font-mono">{PUBLIC_SITE_URL}</span>
        {current.width && <span style={{ marginLeft: 'auto', color: '#555' }}>{current.width}×{current.height}px</span>}
      </div>
    </div>
  );
}

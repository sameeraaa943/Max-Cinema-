import React, { useState } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  RefreshCw,
  Lock,
} from 'lucide-react';

export default function SitePreviewPage() {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const [previewPath, setPreviewPath] = useState('');

  const publicBaseUrl = 'https://cinescopecodespactor.netlify.app';
  const iframeSrc = `${publicBaseUrl}${previewPath ? (previewPath.startsWith('/') ? previewPath : `/${previewPath}`) : ''}`;

  const deviceStyles = {
    desktop: { width: '100%', height: 'calc(100vh - 220px)', borderRadius: '12px' },
    tablet: { width: '768px', height: '1024px', maxHeight: 'calc(100vh - 220px)', borderRadius: '24px' },
    mobile: { width: '390px', height: '844px', maxHeight: 'calc(100vh - 220px)', borderRadius: '36px' },
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto flex flex-col h-full">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white font-cinzel tracking-wide">Live Site Preview</h1>
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider"
              style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}
            >
              CONNECTED
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Real-time responsive sandbox for Max Cinema public interface.
          </p>
        </div>

        {/* Device Switcher & Actions */}
        <div className="flex items-center gap-3">
          <div
            className="p-1 rounded-xl flex items-center gap-1"
            style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
          >
            <button
              onClick={() => setDevice('desktop')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
              style={{
                backgroundColor: device === 'desktop' ? '#D4AF37' : 'transparent',
                color: device === 'desktop' ? '#070707' : '#8A8A8A',
              }}
            >
              <Monitor size={14} />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              onClick={() => setDevice('tablet')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
              style={{
                backgroundColor: device === 'tablet' ? '#D4AF37' : 'transparent',
                color: device === 'tablet' ? '#070707' : '#8A8A8A',
              }}
            >
              <Tablet size={14} />
              <span className="hidden sm:inline">Tablet</span>
            </button>
            <button
              onClick={() => setDevice('mobile')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
              style={{
                backgroundColor: device === 'mobile' ? '#D4AF37' : 'transparent',
                color: device === 'mobile' ? '#070707' : '#8A8A8A',
              }}
            >
              <Smartphone size={14} />
              <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>

          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="p-2.5 rounded-xl bg-[#121212] border border-[#242424] text-muted hover:text-white transition-colors"
            title="Reload Preview"
          >
            <RefreshCw size={14} />
          </button>

          <a
            href={iframeSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold btn-gold flex items-center gap-1.5"
            style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)', color: '#070707' }}
          >
            <ExternalLink size={14} />
            <span>Open Live Site</span>
          </a>
        </div>
      </div>

      {/* URL Navigation Bar */}
      <div
        className="p-2.5 rounded-xl flex items-center gap-2 text-xs"
        style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
      >
        <Lock size={12} className="text-emerald-400 shrink-0 ml-1" />
        <span className="text-muted font-mono text-[11px] shrink-0">{publicBaseUrl}</span>
        <input
          type="text"
          placeholder="/movies, /tv, /movie/:id ..."
          value={previewPath}
          onChange={(e) => setPreviewPath(e.target.value)}
          className="flex-1 px-2.5 py-1 rounded bg-[#0D0D0D] border border-[#242424] text-white font-mono text-xs focus:outline-none"
        />
      </div>

      {/* Device Frame Viewport Container */}
      <div className="flex-1 flex items-center justify-center p-4 bg-[#080808] border border-[#202020] rounded-2xl overflow-hidden min-h-[500px]">
        <div
          className="transition-all duration-300 shadow-2xl overflow-hidden border border-[#2e2e2e] bg-black flex flex-col"
          style={deviceStyles[device]}
        >
          {device !== 'desktop' && (
            <div className="h-6 bg-[#1a1a1a] flex items-center justify-center border-b border-[#2e2e2e]">
              <div className="w-12 h-1 bg-[#333] rounded-full" />
            </div>
          )}
          <iframe
            key={refreshKey}
            src={iframeSrc}
            title="Max Cinema Live Site Preview"
            className="w-full flex-1 border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      </div>
    </div>
  );
}

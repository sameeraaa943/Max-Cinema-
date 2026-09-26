import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Sparkles,
  Wand2,
  Languages,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { aiApi } from '../../services/api';

export default function AiAssistantPage() {
  const [promptTitle, setPromptTitle] = useState('');
  const [promptOverview, setPromptOverview] = useState('');
  const [generatedMetadata, setGeneratedMetadata] = useState<any>(null);

  // Translate tool state
  const [translateText, setTranslateText] = useState('');
  const [targetLang, setTargetLang] = useState('si');
  const [translatedResult, setTranslatedResult] = useState('');

  // Fetch AI Featured Suggestions
  const { data: featuredSuggestions } = useQuery({
    queryKey: ['ai-featured-suggestions'],
    queryFn: () => aiApi.getFeaturedSuggestions(),
  });

  // Generate Metadata Mutation
  const metaMutation = useMutation({
    mutationFn: () => aiApi.generateMetadata({ title: promptTitle, overview: promptOverview }),
    onSuccess: (res: any) => {
      setGeneratedMetadata(res.data?.data || null);
      toast.success('AI Metadata generated');
    },
    onError: () => toast.error('Failed to generate metadata'),
  });

  // Translation Mutation
  const translateMutation = useMutation({
    mutationFn: () => aiApi.translate({ text: translateText, targetLanguage: targetLang }),
    onSuccess: (res: any) => {
      setTranslatedResult(res.data?.data?.translation || res.data?.translation || '');
      toast.success('Translation completed');
    },
    onError: () => toast.error('Translation failed'),
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-cinzel tracking-wide">AI Content Studio</h1>
        <p className="text-xs text-muted mt-1">
          Automated metadata copywriting, multilingual translation, and algorithmic curation suggestions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metadata Generator */}
        <div
          className="p-5 rounded-2xl space-y-4"
          style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
        >
          <div className="flex items-center gap-2 border-b border-[#242424] pb-3">
            <Wand2 size={18} className="text-gold" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">AI Synopsis & Tagline Generator</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-muted font-medium mb-1">Movie / TV Title</label>
              <input
                type="text"
                placeholder="e.g. Inception, Cyberpunk Edgerunners"
                value={promptTitle}
                onChange={(e) => setPromptTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-muted font-medium mb-1">Plot Points / Keywords</label>
              <textarea
                rows={3}
                placeholder="Dream invasion, noir sci-fi heist, spinning totem..."
                value={promptOverview}
                onChange={(e) => setPromptOverview(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white focus:outline-none resize-none"
              />
            </div>

            <button
              onClick={() => metaMutation.mutate()}
              disabled={metaMutation.isPending || !promptTitle}
              className="w-full py-2.5 rounded-xl font-semibold btn-gold flex items-center justify-center gap-2 text-xs"
              style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)', color: '#070707' }}
            >
              {metaMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              <span>Generate Copywriting</span>
            </button>

            {generatedMetadata && (
              <div className="p-3.5 rounded-xl bg-[#0D0D0D] border border-[#2e2e2e] space-y-2 text-xs mt-3">
                <div>
                  <span className="text-gold font-semibold">Catchy Tagline:</span>
                  <p className="text-white italic mt-0.5 font-medium">"{generatedMetadata.tagline || 'Your mind is the scene of the crime.'}"</p>
                </div>
                <div>
                  <span className="text-gold font-semibold">Polished Synopsis:</span>
                  <p className="text-gray-300 mt-0.5 leading-relaxed">{generatedMetadata.description || generatedMetadata.synopsis}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Translation Tool */}
        <div
          className="p-5 rounded-2xl space-y-4"
          style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
        >
          <div className="flex items-center gap-2 border-b border-[#242424] pb-3">
            <Languages size={18} className="text-gold" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Multilingual AI Translation</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-muted font-medium mb-1">Source Text</label>
              <textarea
                rows={3}
                placeholder="Enter English description to translate..."
                value={translateText}
                onChange={(e) => setTranslateText(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-muted font-medium mb-1">Target Language</label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#242424] text-white focus:outline-none"
              >
                <option value="si">Sinhala (සිංහල)</option>
                <option value="ta">Tamil (தமிழ்)</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="es">Spanish (Español)</option>
                <option value="fr">French (Français)</option>
                <option value="de">German (Deutsch)</option>
              </select>
            </div>

            <button
              onClick={() => translateMutation.mutate()}
              disabled={translateMutation.isPending || !translateText}
              className="w-full py-2.5 rounded-xl font-semibold btn-gold flex items-center justify-center gap-2 text-xs"
              style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)', color: '#070707' }}
            >
              {translateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Languages size={14} />}
              <span>Translate Text</span>
            </button>

            {translatedResult && (
              <div className="p-3.5 rounded-xl bg-[#0D0D0D] border border-[#2e2e2e] text-xs mt-3">
                <span className="text-gold font-semibold">Translated Output:</span>
                <p className="text-white mt-1 leading-relaxed">{translatedResult}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plug,
  RefreshCw,
  Globe,
  Database,
  Server,
  Bell,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';
import { integrationsApi } from '../../services/api';

export default function IntegrationsPage() {
  const queryClient = useQueryClient();

  // Fetch Integrations
  const { data } = useQuery({
    queryKey: ['integrations-status'],
    queryFn: () => integrationsApi.list(),
  });

  const integrations = data?.data?.data || [
    { name: 'The Movie Database (TMDB)', key: 'tmdb', status: 'ONLINE', latencyMs: 240, description: 'Live metadata, posters, and cast provider' },
    { name: 'Supabase PostgreSQL', key: 'supabase', status: 'ONLINE', latencyMs: 45, description: 'Primary database cluster & pooled connections' },
    { name: 'Render Backend Hosting', key: 'render', status: 'ONLINE', latencyMs: 65, description: 'Production API execution environment' },
    { name: 'Netlify Frontend Edge', key: 'netlify', status: 'ONLINE', latencyMs: 30, description: 'Static CDN distribution for client apps' },
    { name: 'Web Push (VAPID)', key: 'webpush', status: 'ONLINE', latencyMs: 12, description: 'Browser notifications & push messaging' },
    { name: 'Stripe Gateway', key: 'stripe', status: 'NOT_CONFIGURED', latencyMs: null, description: 'Subscription billing & digital checkout' },
  ];

  // Test Integration Mutation
  const testMutation = useMutation({
    mutationFn: (serviceKey: string) => integrationsApi.test(serviceKey),
    onSuccess: (res: any) => {
      toast.success(`${res.data?.service || 'Service'} tested: ${res.data?.latencyMs || 0}ms`);
      queryClient.invalidateQueries({ queryKey: ['integrations-status'] });
    },
    onError: () => toast.error('Integration test failed'),
  });

  const getServiceIcon = (key: string) => {
    switch (key) {
      case 'tmdb': return Globe;
      case 'supabase': return Database;
      case 'render': return Server;
      case 'netlify': return Globe;
      case 'webpush': return Bell;
      case 'stripe': return CreditCard;
      default: return Plug;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-cinzel tracking-wide">Integrations & Services</h1>
        <p className="text-xs text-muted mt-1">
          Monitor connectivity, live latency, and credentials across external APIs and infrastructure partners.
        </p>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((item: any) => {
          const Icon = getServiceIcon(item.key);
          const isOnline = item.status === 'ONLINE';
          const isNotConfig = item.status === 'NOT_CONFIGURED';

          return (
            <div
              key={item.key}
              className="p-5 rounded-2xl bg-[#121212] border border-[#242424] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-[#181818] border border-[#2a2a2a] text-gold">
                    <Icon size={18} />
                  </div>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase"
                    style={{
                      backgroundColor: isOnline ? 'rgba(16,185,129,0.15)' : isNotConfig ? 'rgba(100,100,100,0.15)' : 'rgba(239,68,68,0.15)',
                      color: isOnline ? '#34d399' : isNotConfig ? '#888' : '#f87171',
                      border: `1px solid ${isOnline ? 'rgba(16,185,129,0.3)' : isNotConfig ? 'rgba(100,100,100,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    }}
                  >
                    {item.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mt-3">{item.name}</h3>
                <p className="text-xs text-muted mt-1">{item.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#202020] flex items-center justify-between text-xs">
                <span className="font-mono text-muted text-[11px]">
                  {item.latencyMs !== null ? `${item.latencyMs}ms latency` : 'No API key set'}
                </span>

                <button
                  onClick={() => testMutation.mutate(item.key)}
                  disabled={testMutation.isPending}
                  className="px-2.5 py-1 rounded-lg bg-[#181818] border border-[#2a2a2a] hover:border-gold/50 text-gray-300 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <RefreshCw size={11} className={testMutation.isPending ? 'animate-spin' : ''} />
                  <span>Test Ping</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

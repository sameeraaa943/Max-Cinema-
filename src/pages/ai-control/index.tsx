import React, { useState, useEffect, useRef } from 'react';
import { Cpu, Send, MessageSquare, Clock, CheckCircle, AlertCircle, Sparkles, ChevronRight } from 'lucide-react';
import { aiControlApi } from '../../services/api';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type Message = {
  type: 'user' | 'ai';
  content: string;
  actions?: any[];
  timestamp: Date;
};

export default function AiControlPage() {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: history = [] } = useQuery({
    queryKey: ['ai-history'],
    queryFn: async () => {
      const res = await aiControlApi.history();
      return res.data?.data || [];
    },
  });

  const commandMutation = useMutation({
    mutationFn: (command: string) => aiControlApi.command(command),
    onSuccess: (res) => {
      setMessages((prev) => [
        ...prev,
        {
          type: 'ai',
          content: res.data?.data?.message || 'Command executed.',
          actions: res.data?.data?.actions || [],
          timestamp: new Date(),
        },
      ]);
      queryClient.invalidateQueries({ queryKey: ['ai-history'] });
    },
    onError: (error: any) => {
      setMessages((prev) => [
        ...prev,
        {
          type: 'ai',
          content: error.response?.data?.message || 'Failed to execute command.',
          timestamp: new Date(),
        },
      ]);
    },
    onSettled: () => {
      setIsTyping(false);
    },
  });

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [
      ...prev,
      { type: 'user', content: text, timestamp: new Date() },
    ]);
    setInput('');
    setIsTyping(true);
    commandMutation.mutate(text);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const examples = ['How many movies?', 'Show latest movies', 'Check system health', 'Find Interstellar', 'How many users?'];

  const stats = {
    total: history.length || 0,
    avgResponse: '1.2s',
    successRate: '98%',
  };

  return (
    <div style={{ padding: '24px', color: '#fff', backgroundColor: '#070707', minHeight: '100vh' }}>
      <header style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Cpu size={32} color="#D4AF37" />
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#fff' }}>AI Control Center</h1>
          <p style={{ margin: 0, color: '#8A8A8A', fontSize: '14px' }}>Control CineScope with natural language</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#121212', padding: '16px', borderRadius: '8px', border: '1px solid #242424' }}>
          <div style={{ color: '#8A8A8A', fontSize: '12px' }}>Total Commands</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#D4AF37' }}>{stats.total}</div>
        </div>
        <div style={{ backgroundColor: '#121212', padding: '16px', borderRadius: '8px', border: '1px solid #242424' }}>
          <div style={{ color: '#8A8A8A', fontSize: '12px' }}>Avg Response Time</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.avgResponse}</div>
        </div>
        <div style={{ backgroundColor: '#121212', padding: '16px', borderRadius: '8px', border: '1px solid #242424' }}>
          <div style={{ color: '#8A8A8A', fontSize: '12px' }}>Success Rate</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4ade80' }}>{stats.successRate}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', height: '600px' }}>
        <div style={{ flex: '6', display: 'flex', flexDirection: 'column', backgroundColor: '#121212', borderRadius: '8px', border: '1px solid #242424', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.length === 0 && !isTyping && (
              <div style={{ margin: 'auto', textAlign: 'center', color: '#8A8A8A' }}>
                <Sparkles size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p>Try asking me something...</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '16px' }}>
                  {examples.map((ex, i) => (
                    <button key={i} onClick={() => handleSend(ex)} style={{ background: '#242424', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: '16px', cursor: 'pointer', fontSize: '12px' }}>
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.type === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: m.type === 'user' ? '#D4AF37' : '#242424',
                  color: m.type === 'user' ? '#000' : '#fff',
                  borderBottomRightRadius: m.type === 'user' ? '4px' : '12px',
                  borderBottomLeftRadius: m.type === 'ai' ? '4px' : '12px',
                }}>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{m.content}</div>
                  {m.actions && m.actions.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                      {m.actions.map((act: any, idx) => (
                        <span key={idx} style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {act.label} <ChevronRight size={12} />
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ backgroundColor: '#242424', padding: '12px 16px', borderRadius: '12px', borderBottomLeftRadius: '4px', color: '#8A8A8A' }}>
                  <span className="dot-typing">...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: '16px', borderTop: '1px solid #242424', display: 'flex', gap: '12px' }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
              placeholder="Type your command..."
              style={{
                flex: 1, background: '#070707', border: '1px solid #242424', borderRadius: '8px', padding: '12px',
                color: '#fff', resize: 'none', height: '48px', fontFamily: 'inherit'
              }}
            />
            <button
              onClick={() => handleSend(input)}
              disabled={isTyping || !input.trim()}
              style={{
                background: '#D4AF37', border: 'none', color: '#000', padding: '0 24px',
                borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                fontWeight: 'bold', opacity: (isTyping || !input.trim()) ? 0.5 : 1
              }}
            >
              <Send size={18} /> Send
            </button>
          </div>
        </div>

        <div style={{ flex: '4', backgroundColor: '#121212', borderRadius: '8px', border: '1px solid #242424', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #242424', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
              <Clock size={18} color="#D4AF37" /> Command History
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {history.map((h: any, i: number) => (
              <div key={i} onClick={() => setInput(h.command)} style={{ cursor: 'pointer', background: '#070707', padding: '12px', borderRadius: '8px', border: '1px solid #242424' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{h.command}</span>
                  {h.status === 'COMPLETED' ? <CheckCircle size={14} color="#4ade80" /> : <AlertCircle size={14} color="#f87171" />}
                </div>
                <div style={{ fontSize: '12px', color: '#8A8A8A' }}>{new Date(h.timestamp || Date.now()).toLocaleString()}</div>
              </div>
            ))}
            {history.length === 0 && <div style={{ color: '#8A8A8A', textAlign: 'center', marginTop: '24px' }}>No history yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

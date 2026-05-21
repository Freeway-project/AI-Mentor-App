'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { MessageSquare, Send, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { AppPageHeader, AppPanel, AppSectionLabel, appTheme } from '@/components/ui/app-theme';
import { cn } from '@/lib/utils';

function formatTime(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function MenteeMessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const data = await apiClient.getConversations();
      setConversations(data);
    } catch {
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const loadMessages = useCallback(async (id: string, silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const data = await apiClient.getMessages(id);
      setMessages(data);
      await apiClient.markConversationRead(id);
      setConversations(prev =>
        prev.map(c => c.id === id ? { ...c, unreadCount: { ...c.unreadCount, mentee: 0 } } : c)
      );
    } catch {
      if (!silent) toast.error('Failed to load messages');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId);
  }, [activeId, loadMessages]);

  useEffect(() => {
    if (!activeId) return;
    const interval = setInterval(() => loadMessages(activeId, true), 10_000);
    return () => clearInterval(interval);
  }, [activeId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !activeId || sending) return;
    setSending(true);
    try {
      const msg = await apiClient.sendChatMessage(activeId, input.trim());
      setMessages(prev => [...prev, msg]);
      setInput('');
      setConversations(prev =>
        prev.map(c => c.id === activeId ? { ...c, lastMessageAt: new Date().toISOString() } : c)
      );
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const activeConv = conversations.find(c => c.id === activeId);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <p className="text-sm text-slate-500 animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl px-4 py-6 sm:px-6 md:py-8 md:px-8 space-y-6">
      <AppPageHeader
        title="Messages"
        description="Inquiry threads with your mentors."
      />

      <div className="flex gap-4 h-[560px]">
        {/* Conversation list */}
        <AppPanel className="w-64 shrink-0 flex flex-col p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <AppSectionLabel>Conversations</AppSectionLabel>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <MessageSquare className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-sm text-slate-400">No conversations yet</p>
                <p className="text-xs text-slate-400 mt-1">Visit a mentor&apos;s profile to start chatting</p>
              </div>
            ) : (
              conversations.map(conv => {
                const unread = conv.unreadCount?.mentee ?? 0;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveId(conv.id)}
                    className={cn(
                      'w-full text-left px-4 py-3 transition-colors',
                      activeId === conv.id
                        ? 'bg-brand/10 border-l-2 border-brand'
                        : 'hover:bg-slate-50 border-l-2 border-transparent'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-800 truncate">{conv.mentorName ?? 'Mentor'}</p>
                      {unread > 0 && (
                        <span className="shrink-0 rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">{unread}</span>
                      )}
                    </div>
                    {conv.lastMessageAt && (
                      <p className="text-xs text-slate-400 mt-0.5">{formatTime(conv.lastMessageAt)}</p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </AppPanel>

        {/* Message thread */}
        <AppPanel className="flex-1 flex flex-col p-0 overflow-hidden">
          {!activeId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageSquare className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-slate-400 font-medium">Select a conversation</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
                <p className="font-semibold text-slate-800 text-sm">{activeConv?.mentorName ?? 'Mentor'}</p>
                <button
                  onClick={() => loadMessages(activeId)}
                  disabled={refreshing}
                  className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.length === 0 && (
                  <p className="text-center text-sm text-slate-400 mt-8">No messages yet. Say hello!</p>
                )}
                {messages.map(msg => {
                  const isMine = msg.senderRole === 'mentee';
                  return (
                    <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                      <div className={cn(
                        'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                        isMine
                          ? 'bg-brand text-white rounded-br-sm'
                          : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                      )}>
                        <p>{msg.content}</p>
                        <p className={cn('text-[10px] mt-1', isMine ? 'text-white/60' : 'text-slate-400')}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="border-t border-slate-100 px-4 py-3 flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Type a message..."
                  className={cn(appTheme.input, 'flex-1 px-3 py-2 text-sm')}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-light disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </AppPanel>
      </div>
    </div>
  );
}

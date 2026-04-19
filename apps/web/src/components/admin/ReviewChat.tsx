'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/services/api';
import { Send } from 'lucide-react';

interface ReviewMessage {
    id: string;
    mentorId: string;
    senderId: string;
    senderRole: 'admin' | 'mentor';
    content: string;
    readByAdmin: boolean;
    readByMentor: boolean;
    createdAt: string;
}

interface ReviewChatProps {
    /** The mentor's profile ID (from admin coaches) */
    mentorId: string;
    /** 'admin' | 'mentor' — which side of the chat are we rendering? */
    viewAs: 'admin' | 'mentor';
    /** Optional context line shown at the top of the thread */
    contextLabel?: string;
}

export function ReviewChat({ mentorId, viewAs, contextLabel }: ReviewChatProps) {
    const qc = useQueryClient();
    const [text, setText] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    const queryKey = ['review-messages', mentorId];

    const basePath = viewAs === 'admin'
        ? `/admin/coaches/${mentorId}/messages`
        : `/mentor-auth/review-messages/${mentorId}`;

    const { data: messages = [], isLoading } = useQuery<ReviewMessage[]>({
        queryKey,
        queryFn: () => apiFetch<ReviewMessage[]>(basePath),
        refetchInterval: 15_000,
    });

    // Mark as read on mount / when messages arrive
    useEffect(() => {
        if (!messages.length) return;
        apiFetch(`${basePath}/read`, { method: 'PATCH' }).catch(() => {/* silent */ });
    }, [messages.length, basePath]);

    // Scroll to newest message
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    const send = useMutation({
        mutationFn: (content: string) =>
            apiFetch<ReviewMessage>(basePath, {
                method: 'POST',
                body: JSON.stringify({ content }),
            }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey });
            setText('');
        },
    });

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!text.trim() || send.isPending) return;
        send.mutate(text.trim());
    };

    return (
        <div className="flex flex-col h-full bg-slate-900/80 rounded-xl border border-slate-700/60 overflow-hidden shadow-sm">

            {/* Header */}
            <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-900/90">
                <p className="text-sm font-semibold text-slate-100">
                    {viewAs === 'admin' ? 'Review Chat with Mentor' : 'Chat with OWL Mentor Admin'}
                </p>
                {contextLabel && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{contextLabel}</p>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0 bg-slate-950/40">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">
                        <p>No messages yet.</p>
                        <p className="mt-1">
                            {viewAs === 'admin'
                                ? 'Send a note to the mentor — they will see it in their dashboard.'
                                : 'The admin hasn\'t sent any messages yet. You can start the conversation.'}
                        </p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.senderRole === viewAs;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed border ${isMe
                                        ? 'bg-brand text-white rounded-br-none border-brand'
                                        : 'bg-slate-900 text-slate-100 rounded-bl-none border-slate-700'
                                        }`}
                                >
                                    <p>{msg.content}</p>
                                    <p
                                        className={`text-[10px] mt-1 ${isMe ? 'text-brand-lighter' : 'text-slate-500'}`}
                                    >
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                                        · {new Date(msg.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form
                onSubmit={handleSend}
                className="flex items-end gap-2 px-3 py-2.5 border-t border-slate-800 bg-slate-900/90"
            >
                <textarea
                    rows={1}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                    }}
                    placeholder="Reply… (Enter to send)"
                    className="flex-1 resize-none px-3 py-2 text-sm text-slate-100 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand placeholder:text-slate-500 min-h-[40px] max-h-28"
                />
                <button
                    type="submit"
                    disabled={!text.trim() || send.isPending}
                    className="w-10 h-10 rounded-lg bg-brand text-white flex items-center justify-center disabled:opacity-40 hover:bg-brand transition-colors shrink-0"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
}

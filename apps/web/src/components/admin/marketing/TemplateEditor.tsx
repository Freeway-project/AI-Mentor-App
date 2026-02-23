'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export interface TemplateFormData {
    name: string;
    subject: string;
    bodyHtml: string;
}

interface TemplateEditorProps {
    initialData?: TemplateFormData & { id?: string };
    onSave: (data: TemplateFormData, id?: string) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    saving?: boolean;
}

export function TemplateEditor({ initialData, onSave, onDelete, saving }: TemplateEditorProps) {
    const [name, setName] = useState(initialData?.name ?? '');
    const [subject, setSubject] = useState(initialData?.subject ?? '');
    const [bodyHtml, setBodyHtml] = useState(initialData?.bodyHtml ?? '');
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        setName(initialData?.name ?? '');
        setSubject(initialData?.subject ?? '');
        setBodyHtml(initialData?.bodyHtml ?? '');
        setShowPreview(false);
    }, [initialData?.id]);

    const handleSave = async () => {
        await onSave({ name, subject, bodyHtml }, initialData?.id);
    };

    const inputCls = 'w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-slate-400';

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
                <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">
                    {initialData?.id ? 'Edit Template' : 'New Template'}
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowPreview((v) => !v)}
                        className="text-xs text-slate-500 hover:text-slate-800 border border-slate-300 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        {showPreview ? '✏️ Edit' : '👁 Preview'}
                    </button>
                    {initialData?.id && onDelete && (
                        <button
                            onClick={() => onDelete(initialData.id!)}
                            className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {!showPreview ? (
                    <>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Template Name</label>
                            <input className={inputCls} placeholder="e.g. Welcome Mentors" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Email Subject</label>
                            <input className={inputCls} placeholder="e.g. Become an OWLMentors mentor today" value={subject} onChange={(e) => setSubject(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                                Body (HTML)
                                <span className="ml-2 text-slate-400 normal-case tracking-normal font-normal">Header &amp; footer added automatically</span>
                            </label>
                            <textarea
                                className={`${inputCls} font-mono text-xs leading-relaxed`}
                                rows={16}
                                placeholder="<p>Hi there!</p><p>We'd love you to join our community...</p>"
                                value={bodyHtml}
                                onChange={(e) => setBodyHtml(e.target.value)}
                            />
                        </div>
                    </>
                ) : (
                    <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                        <div className="bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                            Email Preview (header + body + footer)
                        </div>
                        <div className="p-4">
                            <div style={{ fontFamily: "'Helvetica Neue',sans-serif", maxWidth: 600, margin: '0 auto', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                                {/* Header */}
                                <div style={{ background: 'linear-gradient(135deg,#0a0a1a,#0f0b1e)', padding: '28px 36px', textAlign: 'center' }}>
                                    <p style={{ color: '#f59e0b', fontSize: 22, fontWeight: 800, margin: 0 }}>🦉 OWLMentors</p>
                                    <p style={{ color: '#94a3b8', fontSize: 12, margin: '6px 0 0' }}>Connect. Learn. Grow.</p>
                                </div>
                                {/* Greeting */}
                                <div style={{ padding: '32px 36px 0' }}>
                                    <p style={{ color: '#0f172a', fontSize: 16, margin: '0 0 4px' }}>Hi [Recipient Name],</p>
                                </div>
                                {/* Body */}
                                <div
                                    style={{ padding: '16px 36px', color: '#334155', fontSize: 15, lineHeight: 1.7 }}
                                    dangerouslySetInnerHTML={{ __html: bodyHtml || '<p style="color:#94a3b8">Your email body will appear here…</p>' }}
                                />
                                {/* CTA */}
                                <div style={{ padding: '28px 36px', textAlign: 'center', borderTop: '1px solid #f1f5f9', marginTop: 8 }}>
                                    <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 16px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Get started today</p>
                                    <a href="#" style={{ display: 'inline-block', padding: '12px 28px', background: '#7c3aed', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14, margin: '0 8px 12px' }}>🎓 Join as Mentor</a>
                                    <a href="#" style={{ display: 'inline-block', padding: '12px 28px', background: '#f59e0b', color: '#000', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14, margin: '0 8px 12px' }}>🚀 Join as Mentee</a>
                                </div>
                                {/* Footer */}
                                <div style={{ background: '#f8fafc', padding: '18px 36px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
                                    <p style={{ color: '#94a3b8', fontSize: 11, margin: 0, lineHeight: 1.6 }}>
                                        © {new Date().getFullYear()} OWLMentors &nbsp;|&nbsp;<a href="#" style={{ color: '#7c3aed', textDecoration: 'none' }}>Visit our website</a><br />
                                        You are receiving this email because your contact was provided to OWLMentors for outreach.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="px-5 py-3 border-t border-slate-200 flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={saving || !name || !subject || !bodyHtml}
                    className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                    {saving ? 'Saving…' : initialData?.id ? 'Update Template' : 'Save Template'}
                </Button>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Save } from 'lucide-react';

interface TemplateEditorProps {
    initialData?: { id?: string; name: string; subject: string; bodyHtml: string };
    onSave: (data: { name: string; subject: string; bodyHtml: string }, id?: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    saving?: boolean;
}

export function TemplateEditor({ initialData, onSave, onDelete, saving }: TemplateEditorProps) {
    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');
    const [bodyHtml, setBodyHtml] = useState('');

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || '');
            setSubject(initialData.subject || '');
            setBodyHtml(initialData.bodyHtml || '');
        } else {
            setName('');
            setSubject('');
            setBodyHtml('');
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, subject, bodyHtml }, initialData?.id);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full bg-slate-50">
            <div className="p-6 flex-1 overflow-y-auto max-w-4xl w-full mx-auto space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">
                        {initialData?.id ? 'Edit Template' : 'New Template'}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Build your HTML email template. A standard header and footer will be automatically appended.
                    </p>
                </div>

                <div className="space-y-4 bg-white p-6 border border-slate-200 rounded-xl shadow-sm">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Template Name (internal)</label>
                        <input
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="e.g. June Re-engagement Campaign"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Subject Line</label>
                        <input
                            required
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="e.g. Unlock your potential with a mentor"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Body (HTML)</label>
                        <textarea
                            required
                            value={bodyHtml}
                            onChange={(e) => setBodyHtml(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm leading-relaxed"
                            rows={15}
                            placeholder="<p>Hello,</p><p>Welcome to OWLMentors...</p>"
                        />
                        <p className="text-xs text-slate-500 mt-2">
                            Note: Do not include `&lt;html&gt;`, `&lt;body&gt;`, or CSS `&lt;style&gt;` blocks. Just the inner HTML wrapped in paragraphs or divs.
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] text-sm">
                {initialData?.id ? (
                    <button
                        type="button"
                        onClick={() => onDelete(initialData.id!)}
                        className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4" /> Delete
                    </button>
                ) : (
                    <div />
                )}
                <Button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800 text-white select-none">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Template'}
                </Button>
            </div>
        </form>
    );
}

'use client';

interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    bodyHtml: string;
    createdAt: string;
    updatedAt: string;
}

interface TemplateListProps {
    templates: EmailTemplate[];
    selectedId: string | null;
    onSelect: (t: EmailTemplate) => void;
    onNew: () => void;
    loading?: boolean;
}

export function TemplateList({ templates, selectedId, onSelect, onNew, loading }: TemplateListProps) {
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">Templates</h2>
                <button
                    onClick={onNew}
                    className="text-xs bg-violet-600 text-white px-3 py-1.5 rounded-lg hover:bg-violet-700 transition-colors font-medium"
                >
                    + New
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-4 text-xs text-slate-400 text-center">Loading templates...</div>
                ) : templates.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-sm">
                        <p>No templates yet.</p>
                        <p className="mt-1">Click <strong>+ New</strong> to create one.</p>
                    </div>
                ) : (
                    templates.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => onSelect(t)}
                            className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${selectedId === t.id ? 'bg-violet-50 border-l-4 border-l-violet-600 pl-3' : ''
                                }`}
                        >
                            <p className="text-sm font-medium text-slate-800 truncate">{t.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">{t.subject}</p>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}

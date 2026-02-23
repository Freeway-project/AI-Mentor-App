import { Plus, Search, FileText } from 'lucide-react';

interface TemplateListProps {
    templates: any[];
    selectedId: string | null;
    onSelect: (template: any) => void;
    onNew: () => void;
    loading?: boolean;
}

export function TemplateList({ templates, selectedId, onSelect, onNew, loading }: TemplateListProps) {
    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
                <button
                    onClick={onNew}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" /> New Template
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {loading ? (
                    <p className="text-center text-slate-400 text-sm py-4">Loading...</p>
                ) : templates.length === 0 ? (
                    <p className="text-center text-slate-400 text-sm py-4">No templates yet</p>
                ) : (
                    templates.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => onSelect(t)}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${selectedId === t.id
                                    ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500'
                                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <FileText className={`w-4 h-4 mt-0.5 shrink-0 ${selectedId === t.id ? 'text-blue-600' : 'text-slate-400'}`} />
                                <div className="overflow-hidden">
                                    <p className={`text-sm font-medium truncate ${selectedId === t.id ? 'text-blue-900' : 'text-slate-900'}`}>
                                        {t.name}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate mt-0.5">{t.subject}</p>
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}

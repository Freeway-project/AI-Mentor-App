'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export interface Recipient {
    id: string;           // local key for React rendering only
    name: string;
    email: string;
}

interface RecipientManagerProps {
    recipients: Recipient[];
    onChange: (recipients: Recipient[]) => void;
}

function genId() {
    return Math.random().toString(36).slice(2);
}

export function RecipientManager({ recipients, onChange }: RecipientManagerProps) {
    const [bulkText, setBulkText] = useState('');
    const [showBulk, setShowBulk] = useState(false);

    const addRow = () => {
        onChange([...recipients, { id: genId(), name: '', email: '' }]);
    };

    const updateRow = (id: string, field: 'name' | 'email', value: string) => {
        onChange(recipients.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    };

    const removeRow = (id: string) => {
        onChange(recipients.filter((r) => r.id !== id));
    };

    const importBulk = () => {
        // Expected format: "Name, email@example.com" per line
        const rows = bulkText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
                const [name, email] = line.split(',').map((s) => s.trim());
                return { id: genId(), name: name || '', email: email || '' };
            });
        onChange([...recipients, ...rows]);
        setBulkText('');
        setShowBulk(false);
    };

    const inputCls = 'flex-1 px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-slate-400';

    const validCount = recipients.filter((r) => r.name && r.email.includes('@')).length;

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
                <div>
                    <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">Recipients</h2>
                    {recipients.length > 0 && (
                        <p className="text-xs text-slate-400 mt-0.5">{validCount} valid of {recipients.length} total</p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowBulk((v) => !v)}
                        className="text-xs text-slate-500 hover:text-slate-800 border border-slate-300 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        {showBulk ? '✕ Close bulk' : '📋 Bulk import'}
                    </button>
                    <button
                        onClick={addRow}
                        className="text-xs bg-violet-600 text-white px-3 py-1.5 rounded-lg hover:bg-violet-700 transition-colors font-medium"
                    >
                        + Add
                    </button>
                </div>
            </div>

            {showBulk && (
                <div className="mx-5 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                    <p className="text-xs text-amber-700 font-medium">Paste one recipient per line: <code>Name, email@example.com</code></p>
                    <textarea
                        rows={5}
                        className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
                        placeholder="Alice Smith, alice@example.com&#10;Bob Jones, bob@example.com"
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                    />
                    <Button size="sm" onClick={importBulk} disabled={!bulkText.trim()} className="bg-amber-500 hover:bg-amber-600 text-white text-xs">
                        Import lines
                    </Button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-5 space-y-2">
                {recipients.length === 0 ? (
                    <div className="text-center text-slate-400 text-sm py-8">
                        <p>No recipients added yet.</p>
                        <p className="mt-1 text-xs">Use <strong>+ Add</strong> or <strong>Bulk import</strong>.</p>
                    </div>
                ) : (
                    recipients.map((r) => (
                        <div key={r.id} className="flex items-center gap-2">
                            <input
                                className={inputCls}
                                placeholder="Name"
                                value={r.name}
                                onChange={(e) => updateRow(r.id, 'name', e.target.value)}
                            />
                            <input
                                className={inputCls}
                                placeholder="email@example.com"
                                value={r.email}
                                onChange={(e) => updateRow(r.id, 'email', e.target.value)}
                            />
                            <button
                                onClick={() => removeRow(r.id)}
                                className="text-slate-400 hover:text-red-500 transition-colors px-1.5 py-1 rounded"
                                title="Remove"
                            >
                                ✕
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

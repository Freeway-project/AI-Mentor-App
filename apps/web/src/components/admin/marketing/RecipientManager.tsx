import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Users, Upload } from 'lucide-react';

export interface Recipient {
    name: string;
    email: string;
}

interface RecipientManagerProps {
    recipients: Recipient[];
    onChange: (recipients: Recipient[]) => void;
}

export function RecipientManager({ recipients, onChange }: RecipientManagerProps) {
    const [bulkInput, setBulkInput] = useState('');
    const [showBulk, setShowBulk] = useState(false);

    const handleAddEmpty = () => {
        onChange([...recipients, { name: '', email: '' }]);
    };

    const handleRemove = (index: number) => {
        const newR = [...recipients];
        newR.splice(index, 1);
        onChange(newR);
    };

    const handleUpdate = (index: number, field: 'name' | 'email', value: string) => {
        const newR = [...recipients];
        newR[index][field] = value;
        onChange(newR);
    };

    const parseBulk = () => {
        const lines = bulkInput.split('\n');
        const newRecipients: Recipient[] = [];
        for (const line of lines) {
            if (!line.trim()) continue;
            // Assume "Name, Email" or "Email"
            const parts = line.split(',').map((p) => p.trim());
            if (parts.length >= 2) {
                newRecipients.push({ name: parts[0], email: parts[1] });
            } else if (parts.length === 1 && parts[0].includes('@')) {
                newRecipients.push({ name: '', email: parts[0] });
            }
        }
        if (newRecipients.length > 0) {
            onChange([...recipients, ...newRecipients]);
            setBulkInput('');
            setShowBulk(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="p-5 border-b border-slate-200 bg-white">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-slate-500" />
                    Recipients ({recipients.length})
                </h2>
                <p className="text-sm text-slate-500 mt-1">Add the people who will receive this campaign.</p>

                <div className="flex gap-2 mt-4">
                    <button
                        onClick={handleAddEmpty}
                        className="flex-1 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Row
                    </button>
                    <button
                        onClick={() => setShowBulk(!showBulk)}
                        className={`flex-1 border px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${showBulk ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-300 hover:border-slate-400 text-slate-700'
                            }`}
                    >
                        <Upload className="w-4 h-4" /> Bulk Import
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
                {showBulk && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
                        <h3 className="text-sm font-semibold text-slate-700 mb-2">Paste CSV Data</h3>
                        <p className="text-xs text-slate-500 mb-3">Format: <code className="bg-slate-100 px-1 rounded">Name, email@example.com</code> per line</p>
                        <textarea
                            className="w-full h-32 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="John Doe, john@example.com&#10;Jane Smith, jane@example.com"
                            value={bulkInput}
                            onChange={(e) => setBulkInput(e.target.value)}
                        />
                        <div className="flex justify-end mt-3">
                            <Button size="sm" onClick={parseBulk} disabled={!bulkInput.trim()}>Import Lines</Button>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    {recipients.length === 0 && !showBulk && (
                        <div className="text-center py-10 bg-white border border-dashed border-slate-300 rounded-xl">
                            <p className="text-slate-500 text-sm">No recipients added yet.</p>
                        </div>
                    )}
                    {recipients.map((r, i) => (
                        <div key={i} className="flex gap-2 items-start bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                            <input
                                type="text"
                                placeholder="Name"
                                value={r.name}
                                onChange={(e) => handleUpdate(i, 'name', e.target.value)}
                                className="flex-1 px-3 py-1.5 border border-transparent hover:border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded text-sm outline-none transition-all bg-slate-50 focus:bg-white"
                            />
                            <input
                                type="email"
                                placeholder="Email address *"
                                required
                                value={r.email}
                                onChange={(e) => handleUpdate(i, 'email', e.target.value)}
                                className="flex-[1.5] px-3 py-1.5 border border-transparent hover:border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded text-sm outline-none transition-all bg-slate-50 focus:bg-white"
                            />
                            <button
                                onClick={() => handleRemove(i)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="Remove"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

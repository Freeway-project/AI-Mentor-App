'use client';

import { useState, useEffect, useRef } from 'react';
import { adminService } from '@/services/admin.service';
import { Button } from '@/components/ui/button';
import { Recipient } from './RecipientManager';

interface CampaignSenderProps {
    selectedTemplateId: string | null;
    selectedTemplateName: string | null;
    recipients: Recipient[];
}

type RunStatus = 'running' | 'complete' | 'failed';

interface CampaignPollData {
    status: RunStatus;
    sent: number;
    failed: number;
    total: number;
    recipients: { name: string; email: string; status: string; errorMessage?: string }[];
}

export function CampaignSender({ selectedTemplateId, selectedTemplateName, recipients }: CampaignSenderProps) {
    const [sending, setSending] = useState(false);
    const [runId, setRunId] = useState<string | null>(null);
    const [pollData, setPollData] = useState<CampaignPollData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const validRecipients = recipients.filter((r) => r.name && r.email.includes('@'));

    const stopPolling = () => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    };

    const startPolling = (id: string) => {
        stopPolling();
        pollRef.current = setInterval(async () => {
            try {
                const data = await adminService.getCampaignRun(id);
                setPollData(data);
                if (data.status === 'complete' || data.status === 'failed') {
                    stopPolling();
                    setSending(false);
                }
            } catch {
                stopPolling();
                setSending(false);
            }
        }, 1500);
    };

    useEffect(() => () => stopPolling(), []);

    const handleSend = async () => {
        if (!selectedTemplateId || validRecipients.length === 0) return;
        setError(null);
        setPollData(null);
        setSending(true);
        try {
            const result = await adminService.sendCampaign(
                selectedTemplateId,
                validRecipients.map(({ name, email }) => ({ name, email }))
            );
            setRunId(result.campaignRunId);
            startPolling(result.campaignRunId);
        } catch (err: any) {
            setError(err.message || 'Failed to start campaign');
            setSending(false);
        }
    };

    const pct = pollData && pollData.total > 0
        ? Math.round(((pollData.sent + pollData.failed) / pollData.total) * 100)
        : 0;

    return (
        <div className="flex flex-col h-full">
            <div className="px-5 py-3 border-b border-slate-200">
                <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">Send Campaign</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Template Summary */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 space-y-1">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Template</p>
                    <p className={`text-sm font-medium ${selectedTemplateName ? 'text-slate-800' : 'text-slate-400'}`}>
                        {selectedTemplateName ?? 'None selected'}
                    </p>
                </div>

                {/* Recipient Summary */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 space-y-1">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Recipients</p>
                    <p className={`text-sm font-medium ${validRecipients.length > 0 ? 'text-slate-800' : 'text-slate-400'}`}>
                        {validRecipients.length > 0 ? `${validRecipients.length} valid recipient(s)` : 'No valid recipients'}
                    </p>
                </div>

                {/* Send Button */}
                <Button
                    onClick={handleSend}
                    disabled={sending || !selectedTemplateId || validRecipients.length === 0}
                    className="w-full bg-brand hover:bg-brand text-white h-11 font-semibold"
                >
                    {sending ? '⏳ Sending in background…' : `🚀 Send to ${validRecipients.length} recipient(s)`}
                </Button>

                {error && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
                        {error}
                    </div>
                )}

                {/* Progress */}
                {pollData && (
                    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold text-slate-700">
                                {pollData.status === 'running' ? '⏳ Sending…' : pollData.status === 'complete' ? '✅ Complete' : '❌ Failed'}
                            </span>
                            <span className="text-slate-500 text-xs">{pollData.sent + pollData.failed} / {pollData.total}</span>
                        </div>

                        {/* Progress bar */}
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${pollData.failed > 0 ? 'bg-amber-500' : 'bg-brand'}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>

                        <div className="flex gap-4 text-xs text-slate-500">
                            <span>✅ Sent: <strong className="text-green-600">{pollData.sent}</strong></span>
                            <span>❌ Failed: <strong className="text-red-500">{pollData.failed}</strong></span>
                            <span>⏳ Pending: <strong className="text-slate-600">{pollData.total - pollData.sent - pollData.failed}</strong></span>
                        </div>

                        {/* Per-recipient status */}
                        {pollData.recipients.length > 0 && (
                            <div className="max-h-48 overflow-y-auto space-y-1 border-t border-slate-100 pt-3">
                                {pollData.recipients.map((r, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0">
                                        <span className="text-slate-600 truncate max-w-[160px]">{r.name} &lt;{r.email}&gt;</span>
                                        <span className={`font-medium ml-2 shrink-0 ${r.status === 'sent' ? 'text-green-600' :
                                                r.status === 'failed' ? 'text-red-500' :
                                                    'text-slate-400'
                                            }`}>
                                            {r.status === 'sent' ? '✅ sent' : r.status === 'failed' ? '❌ failed' : '⏳ pending'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

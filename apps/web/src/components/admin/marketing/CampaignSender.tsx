import { useState, useEffect, useRef } from 'react';
import { adminService } from '@/services/admin.service';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Recipient } from './RecipientManager';

interface CampaignSenderProps {
    selectedTemplateId: string | null;
    selectedTemplateName: string | null;
    recipients: Recipient[];
}

export function CampaignSender({ selectedTemplateId, selectedTemplateName, recipients }: CampaignSenderProps) {
    const [sending, setSending] = useState(false);
    const [runId, setRunId] = useState<string | null>(null);
    const [status, setStatus] = useState<any>(null); // from polling
    const validRecipients = recipients.filter((r) => r.email && r.email.includes('@'));

    // Polling mechanism
    const timerRef = useRef<any>(null);

    useEffect(() => {
        if (!runId) return;

        const poll = async () => {
            try {
                const data = await adminService.getCampaignRun(runId);
                setStatus(data);
                if (data.status === 'complete' || data.status === 'failed') {
                    clearInterval(timerRef.current);
                    setSending(false);
                    if (data.status === 'complete') {
                        toast.success(`Campaign finished! Sent ${data.sent} of ${data.total}.`);
                    }
                }
            } catch (e) {
                console.error('Polling error', e);
            }
        };

        timerRef.current = setInterval(poll, 1500);
        poll(); // immediate first hit

        return () => clearInterval(timerRef.current);
    }, [runId]);

    const handleSend = async () => {
        if (!selectedTemplateId) return toast.error('Select a template first.');
        if (validRecipients.length === 0) return toast.error('Add at least one valid recipient.');

        if (!confirm(`Ready to send "${selectedTemplateName}" to ${validRecipients.length} people?`)) return;

        setSending(true);
        setStatus(null);
        setRunId(null);

        try {
            const res = await adminService.sendCampaign(selectedTemplateId, validRecipients);
            setRunId(res.campaignRunId);
            toast.info('Campaign queued. Monitoring progress...');
        } catch (err: any) {
            toast.error(err.message || 'Failed to start campaign');
            setSending(false);
        }
    };

    const isComplete = status?.status === 'complete';
    const progressPct = status ? Math.round(((status.sent + status.failed) / status.total) * 100) : 0;

    return (
        <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-100">
            <div className="p-6 flex-1 overflow-y-auto flex flex-col items-center justify-center text-center">
                {!status && !sending && (
                    <div className="space-y-6 w-full max-w-[240px]">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <Send className="w-7 h-7 text-blue-400" />
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg text-white">Ready to Send</h3>
                            <div className="text-sm text-slate-400 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 space-y-2">
                                <div className="flex justify-between">
                                    <span>Template:</span>
                                    <span className="text-slate-200 font-medium truncate max-w-[100px]">{selectedTemplateName || 'None'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Recipients:</span>
                                    <span className="text-slate-200 font-medium">{validRecipients.length}</span>
                                </div>
                            </div>
                        </div>

                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-6 rounded-xl shadow-lg shadow-blue-900/20"
                            disabled={validRecipients.length === 0 || !selectedTemplateId}
                            onClick={handleSend}
                        >
                            Start Sending
                        </Button>
                    </div>
                )}

                {/* Active / Complete State */}
                {(sending || status) && (
                    <div className="w-full space-y-8 animate-in fade-in duration-500">
                        {isComplete ? (
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/30">
                                <CheckCircle2 className="w-8 h-8 text-green-400" />
                            </div>
                        ) : (
                            <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto" />
                        )}

                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">
                                {isComplete ? 'Campaign Complete' : 'Sending Campaign...'}
                            </h3>
                            <p className="text-sm text-slate-400">
                                {status ? `Processed ${status.sent + status.failed} of ${status.total}` : 'Starting background workers...'}
                            </p>
                        </div>

                        {/* Progress Bar */}
                        {status && (
                            <div className="w-full space-y-2 text-left">
                                <div className="flex justify-between text-xs font-medium text-slate-300">
                                    <span>Progress</span>
                                    <span>{progressPct}%</span>
                                </div>
                                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500"
                                        style={{ width: `${progressPct}%` }}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-6">
                                    <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 text-center">
                                        <p className="text-xs text-slate-500 mb-1">Delivered</p>
                                        <p className="text-2xl font-semibold text-green-400">{status.sent}</p>
                                    </div>
                                    <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 text-center">
                                        <p className="text-xs text-slate-500 mb-1">Failed</p>
                                        <p className="text-2xl font-semibold text-red-400">{status.failed}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isComplete && (
                <div className="p-6 w-full">
                    <Button
                        variant="outline"
                        className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                        onClick={() => {
                            setStatus(null);
                            setRunId(null);
                        }}
                    >
                        Send Another
                    </Button>
                </div>
            )}
        </div>
    );
}

'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminService } from '@/services/admin.service';
import { TemplateList } from '@/components/admin/marketing/TemplateList';
import { TemplateEditor } from '@/components/admin/marketing/TemplateEditor';
import { RecipientManager, Recipient } from '@/components/admin/marketing/RecipientManager';
import { CampaignSender } from '@/components/admin/marketing/CampaignSender';

export default function MarketingPage() {
    const qc = useQueryClient();
    const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
    const [isNew, setIsNew] = useState(false);
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [activeTab, setActiveTab] = useState<'templates' | 'campaign' | 'history'>('templates');

    // ─── Data Fetching ──────────────────────────────────────────────────────────
    const { data: templates = [], isLoading: templatesLoading } = useQuery({
        queryKey: ['marketing-templates'],
        queryFn: adminService.getMarketingTemplates,
    });

    const { data: campaignRuns = [] } = useQuery({
        queryKey: ['campaign-runs'],
        queryFn: adminService.listCampaignRuns,
        refetchInterval: activeTab === 'history' ? 5000 : false,
    });

    // ─── Mutations ──────────────────────────────────────────────────────────────
    const createTemplate = useMutation({
        mutationFn: (data: { name: string; subject: string; bodyHtml: string }) =>
            adminService.createMarketingTemplate(data),
        onSuccess: (created) => {
            qc.invalidateQueries({ queryKey: ['marketing-templates'] });
            setSelectedTemplate(created);
            setIsNew(false);
            toast.success('Template saved!');
        },
        onError: (e: any) => toast.error(e.message),
    });

    const updateTemplate = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            adminService.updateMarketingTemplate(id, data),
        onSuccess: (updated) => {
            qc.invalidateQueries({ queryKey: ['marketing-templates'] });
            setSelectedTemplate(updated);
            toast.success('Template updated!');
        },
        onError: (e: any) => toast.error(e.message),
    });

    const deleteTemplate = useMutation({
        mutationFn: (id: string) => adminService.deleteMarketingTemplate(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['marketing-templates'] });
            setSelectedTemplate(null);
            setIsNew(false);
            toast.success('Template deleted.');
        },
        onError: (e: any) => toast.error(e.message),
    });

    // ─── Handlers ───────────────────────────────────────────────────────────────
    const handleSave = useCallback(async (data: { name: string; subject: string; bodyHtml: string }, id?: string) => {
        if (id) {
            await updateTemplate.mutateAsync({ id, data });
        } else {
            await createTemplate.mutateAsync(data);
        }
    }, [createTemplate, updateTemplate]);

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm('Delete this template?')) return;
        await deleteTemplate.mutateAsync(id);
    }, [deleteTemplate]);

    const handleNewTemplate = () => {
        setSelectedTemplate(null);
        setIsNew(true);
    };

    // ─── Helpers ─────────────────────────────────────────────────────────────────
    const saving = createTemplate.isPending || updateTemplate.isPending;

    const tabs = [
        { id: 'templates', label: '✏️ Templates' },
        { id: 'campaign', label: '🚀 Send Campaign' },
        { id: 'history', label: '📋 History' },
    ] as const;

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
            {/* Page Header */}
            <div className="px-8 py-5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">📣 Marketing</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Create email templates and send campaigns to your prospects</p>
                </div>
                {/* Tab switcher */}
                <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab: Templates */}
            {activeTab === 'templates' && (
                <div className="flex flex-1 overflow-hidden min-h-0">
                    {/* Template List */}
                    <div className="w-64 shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
                        <TemplateList
                            templates={templates}
                            selectedId={selectedTemplate?.id ?? null}
                            onSelect={(t) => { setSelectedTemplate(t); setIsNew(false); }}
                            onNew={handleNewTemplate}
                            loading={templatesLoading}
                        />
                    </div>

                    {/* Template Editor */}
                    <div className="flex-1 bg-white overflow-hidden flex flex-col">
                        {(selectedTemplate || isNew) ? (
                            <TemplateEditor
                                key={selectedTemplate?.id ?? 'new'}
                                initialData={selectedTemplate ? { ...selectedTemplate, id: selectedTemplate.id } : undefined}
                                onSave={handleSave}
                                onDelete={handleDelete}
                                saving={saving}
                            />
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-slate-400">
                                <div className="text-center">
                                    <p className="text-4xl mb-3">✉️</p>
                                    <p className="font-medium">Select a template to edit</p>
                                    <p className="text-sm mt-1">or click <strong>+ New</strong> to create one</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tab: Send Campaign */}
            {activeTab === 'campaign' && (
                <div className="flex flex-1 overflow-hidden min-h-0">
                    {/* Template Picker */}
                    <div className="w-64 shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
                        <TemplateList
                            templates={templates}
                            selectedId={selectedTemplate?.id ?? null}
                            onSelect={setSelectedTemplate}
                            onNew={handleNewTemplate}
                            loading={templatesLoading}
                        />
                    </div>

                    {/* Recipients */}
                    <div className="flex-1 border-r border-slate-200 bg-white overflow-hidden flex flex-col">
                        <RecipientManager recipients={recipients} onChange={setRecipients} />
                    </div>

                    {/* Send Panel */}
                    <div className="w-80 shrink-0 bg-white overflow-hidden flex flex-col">
                        <CampaignSender
                            selectedTemplateId={selectedTemplate?.id ?? null}
                            selectedTemplateName={selectedTemplate?.name ?? null}
                            recipients={recipients}
                        />
                    </div>
                </div>
            )}

            {/* Tab: History */}
            {activeTab === 'history' && (
                <div className="flex-1 overflow-y-auto p-8">
                    {campaignRuns.length === 0 ? (
                        <div className="text-center text-slate-400 mt-16">
                            <p className="text-4xl mb-3">📋</p>
                            <p className="font-medium">No campaigns sent yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4 max-w-4xl mx-auto">
                            {campaignRuns.map((run: any) => (
                                <div key={run.id} className="bg-white rounded-xl border border-slate-200 p-5">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-semibold text-slate-900">{run.templateName}</p>
                                            <p className="text-sm text-slate-500 mt-0.5">{run.subject}</p>
                                        </div>
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${run.status === 'complete' ? 'bg-green-100 text-green-700' :
                                                run.status === 'running' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {run.status}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex gap-6 text-sm text-slate-600">
                                        <span>📤 {run.total} total</span>
                                        <span className="text-green-600">✅ {run.sent} sent</span>
                                        {run.failed > 0 && <span className="text-red-500">❌ {run.failed} failed</span>}
                                    </div>
                                    {run.startedAt && (
                                        <p className="text-xs text-slate-400 mt-2">
                                            Started {new Date(run.startedAt).toLocaleString()}
                                            {run.completedAt && ` · Completed ${new Date(run.completedAt).toLocaleString()}`}
                                        </p>
                                    )}
                                    {/* Progress bar */}
                                    {run.status === 'running' && (
                                        <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-violet-500 rounded-full transition-all"
                                                style={{ width: `${Math.round(((run.sent + run.failed) / run.total) * 100)}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

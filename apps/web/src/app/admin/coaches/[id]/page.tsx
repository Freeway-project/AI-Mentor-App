'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Globe, DollarSign, Clock, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
            <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">{title}</h2>
            {children}
        </div>
    );
}

function Tag({ label }: { label: string }) {
    return (
        <span className="inline-block bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-full">
            {label}
        </span>
    );
}

export default function MentorReviewPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const qc = useQueryClient();

    const [rejectNote, setRejectNote] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);

    const { data: mentor, isLoading, isError } = useQuery({
        queryKey: ['admin-coach-detail', id],
        queryFn: () => adminService.getCoachById(id),
        enabled: !!id,
    });

    const approve = useMutation({
        mutationFn: () => adminService.approveCoach(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-coaches-pending'] });
            qc.invalidateQueries({ queryKey: ['admin-coaches-all'] });
            qc.invalidateQueries({ queryKey: ['admin-stats'] });
            qc.invalidateQueries({ queryKey: ['admin-coach-detail', id] });
        },
    });

    const reject = useMutation({
        mutationFn: (note: string) => adminService.rejectCoach(id, note),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-coaches-pending'] });
            qc.invalidateQueries({ queryKey: ['admin-coaches-all'] });
            qc.invalidateQueries({ queryKey: ['admin-stats'] });
            qc.invalidateQueries({ queryKey: ['admin-coach-detail', id] });
            setShowRejectForm(false);
            setRejectNote('');
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full py-32">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (isError || !mentor) {
        return (
            <div className="p-8 text-center text-slate-500">
                <p>Mentor not found or could not be loaded.</p>
                <Link href="/admin/coaches" className="text-blue-600 hover:underline text-sm mt-2 inline-block">← Back to Coaches</Link>
            </div>
        );
    }

    const isPending = mentor.approvalStatus === 'pending';

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 text-slate-600" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-slate-900">{mentor.name}</h1>
                            <StatusBadge status={mentor.approvalStatus} />
                        </div>
                        {mentor.headline && <p className="text-slate-500 text-sm mt-0.5">{mentor.headline}</p>}
                    </div>
                </div>

                {/* Action Buttons */}
                {isPending && (
                    <div className="flex gap-2">
                        <Button
                            disabled={approve.isPending}
                            onClick={() => approve.mutate()}
                            className="bg-green-600 hover:bg-green-700 text-white gap-2"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Approve
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setShowRejectForm(!showRejectForm)}
                            className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                        >
                            <XCircle className="w-4 h-4" />
                            Reject
                        </Button>
                    </div>
                )}
            </div>

            {/* Rejection Form */}
            {showRejectForm && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-medium text-red-700">Provide a reason for rejection (this may be sent to the mentor):</p>
                    <textarea
                        rows={3}
                        value={rejectNote}
                        onChange={(e) => setRejectNote(e.target.value)}
                        placeholder="e.g. Missing professional experience, incomplete profile..."
                        className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 placeholder:text-slate-400"
                    />
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={() => { if (rejectNote.trim()) reject.mutate(rejectNote.trim()); }}
                            disabled={!rejectNote.trim() || reject.isPending}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Confirm Rejection
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowRejectForm(false)}>Cancel</Button>
                    </div>
                </div>
            )}

            {/* Prior rejection note */}
            {mentor.approvalNote && mentor.approvalStatus === 'rejected' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                    <span className="font-semibold">Rejection Note:</span> {mentor.approvalNote}
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">

                {/* Bio */}
                {mentor.bio && (
                    <div className="md:col-span-2">
                        <Section title="Bio">
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{mentor.bio}</p>
                        </Section>
                    </div>
                )}

                {/* Stats */}
                <Section title="Overview">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                            <Star className="w-4 h-4 text-amber-500" />
                            <span><strong>{mentor.rating?.toFixed(1) ?? '—'}</strong> rating ({mentor.totalReviews ?? 0} reviews)</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <span><strong>{mentor.totalMeetings ?? 0}</strong> sessions</span>
                        </div>
                        {mentor.hourlyRate && (
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                                <DollarSign className="w-4 h-4 text-green-500" />
                                <span><strong>${mentor.hourlyRate}</strong> / hour</span>
                            </div>
                        )}
                        {mentor.timezone && (
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                                <Globe className="w-4 h-4 text-slate-400" />
                                <span>{mentor.timezone}</span>
                            </div>
                        )}
                    </div>
                    <div className="pt-2 border-t border-slate-100 text-xs text-slate-400 space-y-0.5">
                        <p>Applied: {mentor.createdAt ? new Date(mentor.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
                        <p>Onboarding Step: <span className="font-medium text-slate-600">{mentor.onboardingStep ?? '—'}</span></p>
                    </div>
                </Section>

                {/* Specialties */}
                {mentor.specialties?.length > 0 && (
                    <Section title="Specialties">
                        <div className="flex flex-wrap gap-2">
                            {mentor.specialties.map((s: string) => <Tag key={s} label={s} />)}
                        </div>
                    </Section>
                )}

                {/* Expertise */}
                {mentor.expertise?.length > 0 && (
                    <Section title="Areas of Expertise">
                        <div className="flex flex-wrap gap-2">
                            {mentor.expertise.map((e: string) => <Tag key={e} label={e} />)}
                        </div>
                    </Section>
                )}

                {/* Languages */}
                {mentor.languages?.length > 0 && (
                    <Section title="Languages">
                        <div className="flex flex-wrap gap-2">
                            {mentor.languages.map((l: string) => <Tag key={l} label={l} />)}
                        </div>
                    </Section>
                )}

                {/* Availability */}
                {mentor.availability && Object.keys(mentor.availability).length > 0 && (
                    <Section title="Availability">
                        <div className="space-y-1.5">
                            {Object.entries(mentor.availability).map(([day, slots]: [string, any]) => (
                                Array.isArray(slots) && slots.length > 0 && (
                                    <div key={day} className="flex items-start gap-2 text-sm text-slate-700">
                                        <span className="w-24 font-medium capitalize shrink-0">{day}:</span>
                                        <span className="text-slate-500">{slots.join(', ')}</span>
                                    </div>
                                )
                            ))}
                        </div>
                    </Section>
                )}

            </div>
        </div>
    );
}

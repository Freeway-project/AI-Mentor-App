'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft, Star, Globe, DollarSign, Clock,
    CheckCircle2, XCircle, FileText, Video, User, Mail, Phone,
} from 'lucide-react';
import Link from 'next/link';
import { ReviewChat } from '@/components/admin/ReviewChat';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <h2 className="font-semibold text-slate-500 text-xs uppercase tracking-wider mb-3">{title}</h2>
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

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="grid grid-cols-[130px_1fr] gap-2 text-sm py-1 border-b border-slate-50 last:border-0">
            <span className="text-slate-400 font-medium">{label}</span>
            <span className="text-slate-800">{value ?? <span className="italic text-slate-300">—</span>}</span>
        </div>
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

    const isPending = mentor.approvalStatus === 'pending' && mentor.onboardingStep === 'published';
    const offers: any[] = mentor.offers || [];
    const policy = mentor.policy || null;
    const certs: any[] = mentor.certifications || [];
    const schedule = mentor.availability?.schedule || [];

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shrink-0"
                    >
                        <ArrowLeft className="w-4 h-4 text-slate-600" />
                    </button>

                    {/* Avatar + name */}
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-slate-200 overflow-hidden border-2 border-slate-300 shrink-0">
                            {mentor.avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={mentor.avatarUrl} alt={mentor.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <User className="w-6 h-6" />
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl font-bold text-slate-900">{mentor.name}</h1>
                                <StatusBadge status={mentor.approvalStatus} />
                                {mentor.isActive && (
                                    <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">● Live</span>
                                )}
                            </div>
                            {mentor.headline && <p className="text-slate-500 text-sm mt-0.5">{mentor.headline}</p>}
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                {mentor.email && (
                                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{mentor.email}</span>
                                )}
                                {mentor.phone && (
                                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{mentor.phone}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                {isPending && (
                    <div className="flex gap-2 shrink-0">
                        <Button
                            disabled={approve.isPending}
                            onClick={() => approve.mutate()}
                            className="bg-green-600 hover:bg-green-700 text-white gap-2"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            {approve.isPending ? 'Approving…' : 'Approve'}
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

            {/* Rejection form */}
            {showRejectForm && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-medium text-red-700">Provide a reason for rejection (visible to the mentor):</p>
                    <textarea
                        rows={3}
                        value={rejectNote}
                        onChange={(e) => setRejectNote(e.target.value)}
                        placeholder="e.g. Missing professional experience, incomplete bio..."
                        className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 placeholder:text-slate-400"
                    />
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={() => { if (rejectNote.trim()) reject.mutate(rejectNote.trim()); }}
                            disabled={!rejectNote.trim() || reject.isPending}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {reject.isPending ? 'Rejecting…' : 'Confirm Rejection'}
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

            {/* Submitted but not yet in published state warning */}
            {mentor.onboardingStep !== 'published' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
                    ℹ️ This mentor is still completing onboarding (step: <strong>{mentor.onboardingStep}</strong>) and has not yet submitted for review.
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left col: all profile data */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Overview stats */}
                    <Section title="Overview">
                        <Row label="Onboarding step" value={mentor.onboardingStep} />
                        <Row label="Approval status" value={mentor.approvalStatus} />
                        <Row label="Active / Live" value={mentor.isActive ? 'Yes' : 'No'} />
                        <Row label="Hourly rate" value={mentor.hourlyRate != null ? `$${mentor.hourlyRate} / hr` : null} />
                        <Row label="Timezone" value={mentor.availability?.timezone} />
                        <Row label="Rating" value={mentor.rating != null ? `${mentor.rating.toFixed(1)} ★ (${mentor.totalReviews} reviews)` : null} />
                        <Row label="Sessions" value={mentor.totalMeetings ?? 0} />
                        <Row label="Joined" value={mentor.createdAt ? new Date(mentor.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null} />
                    </Section>

                    {/* Bio */}
                    <Section title="Bio">
                        {mentor.bio
                            ? <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{mentor.bio}</p>
                            : <p className="text-sm italic text-slate-300">No bio provided</p>}
                    </Section>

                    {/* Specialties + Expertise */}
                    <div className="grid md:grid-cols-2 gap-5">
                        <Section title="Specialties">
                            {mentor.specialties?.length > 0
                                ? <div className="flex flex-wrap gap-2">{mentor.specialties.map((s: string) => <Tag key={s} label={s} />)}</div>
                                : <p className="text-sm italic text-slate-300">None listed</p>}
                        </Section>
                        <Section title="Expertise">
                            {mentor.expertise?.length > 0
                                ? <div className="flex flex-wrap gap-2">{mentor.expertise.map((e: string) => <Tag key={e} label={e} />)}</div>
                                : <p className="text-sm italic text-slate-300">None listed</p>}
                        </Section>
                    </div>

                    {/* Languages */}
                    <Section title="Languages">
                        {mentor.languages?.length > 0
                            ? <div className="flex flex-wrap gap-2">{mentor.languages.map((l: string) => <Tag key={l} label={l} />)}</div>
                            : <p className="text-sm italic text-slate-300">None listed</p>}
                    </Section>

                    {/* Availability */}
                    <Section title="Weekly Availability">
                        {schedule.length > 0 ? (
                            <div className="space-y-1.5">
                                {mentor.availability?.timezone && (
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                                        <Globe className="w-3.5 h-3.5" />
                                        {mentor.availability.timezone}
                                    </div>
                                )}
                                {schedule.map((slot: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 text-sm">
                                        <span className="w-24 font-medium text-slate-700">{DAYS[slot.dayOfWeek]}</span>
                                        <span className="text-slate-500">{slot.startTime} – {slot.endTime}</span>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-sm italic text-slate-300">No availability set</p>}
                    </Section>

                    {/* Policies */}
                    <Section title="Cancellation Policies">
                        {policy ? (
                            <div>
                                <Row label="Cancellation" value={`${policy.cancellationHours}h notice`} />
                                <Row label="Reschedule" value={`${policy.rescheduleHours}h notice`} />
                                <Row label="No-show" value={policy.noShowPolicy} />
                                {policy.customTerms && <Row label="Custom terms" value={policy.customTerms} />}
                            </div>
                        ) : <p className="text-sm italic text-slate-300">No policies configured</p>}
                    </Section>

                    {/* Session Offers */}
                    <Section title={`Session Offers (${offers.length})`}>
                        {offers.length > 0 ? (
                            <div className="space-y-3">
                                {offers.map((offer: any) => (
                                    <div key={offer.id} className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-100 last:border-0">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">{offer.title}</p>
                                            {offer.description && (
                                                <p className="text-xs text-slate-500 mt-0.5">{offer.description}</p>
                                            )}
                                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />{offer.durationMinutes} min
                                            </p>
                                        </div>
                                        <p className="text-sm font-bold text-green-600 shrink-0">
                                            <DollarSign className="w-3.5 h-3.5 inline" />{offer.price}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-sm italic text-slate-300">No session offers added</p>}
                    </Section>

                    {/* Certifications */}
                    <Section title={`Certifications (${certs.length})`}>
                        {certs.length > 0 ? (
                            <ul className="space-y-2">
                                {certs.map((cert: any) => (
                                    <li key={cert.fileKey} className="flex items-center gap-3">
                                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span className="flex-1 text-sm text-slate-700 font-medium">{cert.name}</span>
                                        <a
                                            href={cert.fileUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-blue-600 hover:underline text-xs shrink-0 font-medium"
                                        >
                                            View ↗
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm italic text-slate-300">No certifications uploaded</p>}
                    </Section>

                    {/* Intro Video */}
                    <Section title="Intro Video">
                        {mentor.introVideoUrl ? (
                            <div className="space-y-2">
                                <video
                                    src={mentor.introVideoUrl}
                                    controls
                                    className="w-full max-h-64 rounded-lg bg-slate-100 border border-slate-200 object-contain"
                                />
                                <p className="text-xs text-emerald-600 flex items-center gap-1">
                                    <Video className="w-3.5 h-3.5" /> Video uploaded
                                </p>
                            </div>
                        ) : <p className="text-sm italic text-slate-300">No intro video uploaded</p>}
                    </Section>

                </div>

                {/* Right col: Review Chat */}
                <div className="lg:col-span-1 flex flex-col" style={{ minHeight: '560px' }}>
                    <ReviewChat
                        mentorId={id}
                        viewAs="admin"
                        contextLabel={`Reviewing: ${mentor.name}${mentor.headline ? ` — ${mentor.headline}` : ''}`}
                    />
                </div>
            </div>
        </div>
    );
}

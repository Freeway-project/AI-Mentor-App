'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, ShieldCheck, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';

export function MentorHighlights() {
    const [mentors, setMentors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.searchMentors(undefined)
            .then(data => setMentors((data.mentors || []).slice(0, 6)))
            .catch(() => setMentors([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <section id="mentors" className="bg-transparent py-16 md:py-24">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-12 space-y-4">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                        Meet Our Mentors
                    </h2>
                    <p className="mx-auto max-w-2xl text-lg text-slate-600">
                        Browse real, verified mentors ready to guide your career journey.
                    </p>
                </div>

                {loading ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-full bg-slate-100" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-slate-100 rounded w-28" />
                                        <div className="h-3 bg-slate-100 rounded w-40" />
                                    </div>
                                </div>
                                <div className="flex gap-1.5">
                                    {[1,2,3].map(j => <div key={j} className="h-5 w-16 bg-slate-100 rounded-full" />)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : mentors.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-slate-500 mb-6">No mentors available yet.</p>
                        <Link
                            href="/browse"
                            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-light"
                        >
                            Browse Mentors <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {mentors.map(mentor => (
                                <Link
                                    key={mentor.id}
                                    href={`/mentors/${mentor.id}`}
                                    className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-brand/30 hover:shadow-xl hover:shadow-brand/5"
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-brand/20 bg-brand/10 flex items-center justify-center text-xl font-semibold text-brand">
                                            {mentor.avatarUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={mentor.avatarUrl} alt={mentor.name} className="h-full w-full object-cover" />
                                            ) : (
                                                mentor.name?.charAt(0)?.toUpperCase()
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <p className="font-bold text-slate-900 truncate group-hover:text-brand transition-colors">
                                                    {mentor.name}
                                                </p>
                                                {mentor.verified && <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />}
                                            </div>
                                            {mentor.headline && (
                                                <p className="text-sm text-slate-500 truncate">{mentor.headline}</p>
                                            )}
                                        </div>
                                    </div>

                                    {mentor.specialties?.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-4">
                                            {mentor.specialties.slice(0, 3).map((s: string) => (
                                                <Badge key={s} variant="outline" className="border-slate-200 bg-slate-50 text-xs text-slate-600">
                                                    {s}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}

                                    {mentor.rating != null && (
                                        <div className="flex items-center gap-1 mt-auto pt-3 border-t border-slate-100">
                                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                            <span className="text-sm font-semibold text-slate-700">{mentor.rating.toFixed(1)}</span>
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </div>

                        <div className="text-center mt-10">
                            <Link
                                href="/browse"
                                className="inline-flex items-center gap-2 rounded-full bg-brand px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-light shadow-md"
                            >
                                See All Mentors <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}

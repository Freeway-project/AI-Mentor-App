import Link from 'next/link';
import { ArrowRight, Sparkles, Search, Calendar, Compass } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function WhatWeDoPage() {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Navbar />
            <main className="flex-1">
                <section className="container mx-auto px-4 py-16 md:py-24">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
                            What We Do
                        </h1>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            You can generate a personalised career path right from the application —
                            describe your background and goals in plain language, and our AI suggests
                            the roles, courses, and certifications that fit, then matches you with
                            mentors who can guide you there.
                        </p>
                    </div>
                </section>

                <section className="container mx-auto px-4 pb-20">
                    <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
                        <Feature
                            icon={Sparkles}
                            title="AI-generated career plans"
                            body="Tell the app what you've done and what you want next. It returns recommended roles, growth paths, and the courses worth taking — tailored to your profile."
                        />
                        <Feature
                            icon={Search}
                            title="Mentor matching from your plan"
                            body="The same keywords drive mentor search, so the person you book has already worked in the area the plan recommends."
                        />
                        <Feature
                            icon={Calendar}
                            title="Book a 1-on-1 in minutes"
                            body="Pick a slot from a mentor's calendar, pay securely, and join a video session — all inside the app."
                        />
                        <Feature
                            icon={Compass}
                            title="Stay accountable"
                            body="Follow-up reminders, session notes, and the option to rebook keep momentum going after the first session."
                        />
                    </div>
                </section>

                <section className="container mx-auto px-4 pb-24">
                    <div className="max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-slate-50 p-8 md:p-12 text-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                            Try the AI career plan
                        </h2>
                        <p className="text-slate-600 mb-6">
                            Sign in and ask for a plan in your own words — admin, beauty, supply chain,
                            digital marketing, anything. You'll get a recommendation and matching
                            mentors right after.
                        </p>
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-light"
                        >
                            Get started
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}

function Feature({
    icon: Icon,
    title,
    body,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    body: string;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand mb-4">
                <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
        </div>
    );
}

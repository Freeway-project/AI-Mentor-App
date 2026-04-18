import { Star } from 'lucide-react';

const testimonials = [
    {
        quote: "Within 3 months of mentorship, I landed my dream job at a FAANG company. My mentor's guidance on system design was invaluable.",
        author: "Alex Chen",
        role: "Software Engineer at Google",
        image: "https://i.pravatar.cc/150?u=alex",
        stars: 5,
    },
    {
        quote: "As a first-time founder, having a mentor who had successfully exited was a game changer. Saved me from making costly mistakes.",
        author: "Maria Garcia",
        role: "Founder at FinTech Startup",
        image: "https://i.pravatar.cc/150?u=maria",
        stars: 5,
    },
    {
        quote: "The mock interviews were brutal but necessary. I went from failing phone screens to getting multiple offers in 6 weeks.",
        author: "David Smith",
        role: "Product Manager at Stripe",
        image: "https://i.pravatar.cc/150?u=david2",
        stars: 5,
    },
];

const companies = ['Google', 'Amazon', 'Netflix', 'Stripe', 'Uber', 'Microsoft', 'Meta', 'Apple'];

export function SocialProof() {
    return (
        <section className="py-20 md:py-28 relative overflow-hidden bg-slate-50/80">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                <div className="absolute top-1/2 left-1/2 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/5 blur-[100px]" />
            </div>

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                {/* Header */}
                <div className="text-center mb-14 space-y-3">
                    <p className="text-brand text-sm font-semibold uppercase tracking-widest">Testimonials</p>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                        Trusted by ambitious learners
                    </h2>
                    <p className="mx-auto max-w-2xl text-lg text-slate-600">
                        Real results from real people — see what our community says about their journey.
                    </p>
                </div>

                {/* Testimonial cards */}
                <div className="grid gap-6 md:grid-cols-3">
                    {testimonials.map((t, i) => (
                        <div key={i}
                            className={`group relative space-y-5 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:border-brand/30 hover:shadow-lg hover:shadow-brand/5`}
                        >
                            <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-brand/0 to-transparent transition-all duration-300 group-hover:via-brand/50" />

                            <div className="flex gap-0.5">
                                {Array.from({ length: t.stars }).map((_, s) => (
                                    <Star key={s} className="h-4 w-4 fill-brand text-brand" />
                                ))}
                            </div>

                            <p className="leading-relaxed text-slate-700">
                                &ldquo;{t.quote}&rdquo;
                            </p>

                            <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
                                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-brand/20">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={t.image} alt={t.author} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">{t.author}</p>
                                    <p className="text-xs text-slate-500">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Companies strip */}
                <div className="mt-16 text-center">
                    <p className="text-xs text-slate-400 uppercase tracking-widest mb-6">Our mentees work at</p>
                    <div className="flex flex-wrap justify-center gap-x-10 gap-y-3">
                        {companies.map((c) => (
                            <span key={c} className="cursor-default text-sm font-semibold tracking-wide text-slate-400 transition-colors hover:text-brand">{c}</span>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

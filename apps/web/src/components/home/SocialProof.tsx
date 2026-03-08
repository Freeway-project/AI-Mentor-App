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
        <section className="py-20 md:py-28 relative overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)' }}
        >
            {/* Section glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-300/40 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-fuchsia-300/30 to-transparent" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-violet-400/10 blur-[100px]" />
            </div>

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                {/* Header */}
                <div className="text-center mb-14 space-y-3">
                    <p className="text-violet-600 text-sm font-semibold uppercase tracking-widest">Testimonials</p>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                        Trusted by ambitious learners
                    </h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Real results from real people — see what our community says about their journey.
                    </p>
                </div>

                {/* Testimonial cards */}
                <div className="grid gap-6 md:grid-cols-3">
                    {testimonials.map((t, i) => (
                        <div key={i}
                            className="group relative rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-sm p-7 space-y-5 hover:border-violet-300/60 hover:shadow-lg transition-all duration-300"
                        >
                            {/* Gradient top border on hover */}
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-200/0 to-transparent group-hover:via-violet-400/50 transition-all duration-300 rounded-t-2xl" />

                            {/* Stars */}
                            <div className="flex gap-0.5">
                                {Array.from({ length: t.stars }).map((_, s) => (
                                    <Star key={s} className="w-4 h-4 text-violet-500 fill-violet-500" />
                                ))}
                            </div>

                            <p className="text-slate-700 leading-relaxed">
                                &ldquo;{t.quote}&rdquo;
                            </p>

                            <div className="flex items-center gap-3 pt-4 border-t border-slate-200/70">
                                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-violet-500/20 shrink-0">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={t.image} alt={t.author} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900 text-sm">{t.author}</p>
                                    <p className="text-xs text-slate-500">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Companies strip */}
                <div className="mt-16 text-center">
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-6">Our mentees work at</p>
                    <div className="flex flex-wrap justify-center gap-x-10 gap-y-3">
                        {companies.map((c) => (
                            <span key={c} className="text-slate-600 font-semibold text-sm tracking-wide hover:text-slate-900 transition-colors cursor-default">{c}</span>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

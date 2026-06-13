import { Star } from 'lucide-react';

export function SocialProof() {
    return (
        <section className="py-20 md:py-28 relative overflow-hidden bg-slate-50/80">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                <div className="absolute top-1/2 left-1/2 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/5 blur-[100px]" />
            </div>

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                        Join our growing community
                    </h2>
                    <p className="text-lg text-slate-600">
                        Connect with expert mentors who are ready to guide you through your career journey.
                        Browse available mentors and book your first session today.
                    </p>
                    <div className="flex items-center justify-center gap-1.5 pt-2">
                        {[1,2,3,4,5].map(i => (
                            <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                        ))}
                        <span className="ml-2 text-sm font-medium text-slate-600">Rated highly by our community</span>
                    </div>
                </div>
            </div>
        </section>
    );
}

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function AboutPage() {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-16 md:py-24">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-8">
                        About Us
                    </h1>

                    <section className="space-y-6 text-slate-700 leading-relaxed">
                        <div>
                            <h2 className="text-2xl font-semibold text-slate-900 mb-3">Blu Codes</h2>
                            <p>
                                Blu Codes is a technology studio building practical AI products that
                                solve real problems for everyday users. We focus on tools that combine
                                clean engineering with human-centred design, so people get answers and
                                outcomes — not just features.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold text-slate-900 mb-3">Owl Mentors</h2>
                            <p>
                                Owl Mentors is one of our applications. It connects people who want to
                                grow — students, career switchers, working professionals — with vetted
                                mentors who have done what the learner is trying to do.
                            </p>
                            <p className="mt-3">
                                You describe what you want help with in plain language. Our AI reads
                                your background, suggests a clear career path with the courses and
                                certifications worth pursuing, and matches you with mentors whose
                                experience lines up with that path. You book a 1-on-1 session, get
                                practical guidance, and move forward.
                            </p>
                            <p className="mt-3">
                                The aim is simple: problem and solution in one place, with a real
                                human mentor to keep you accountable.
                            </p>
                        </div>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
}

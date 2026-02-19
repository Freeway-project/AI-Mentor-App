import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export function Hero() {
    return (
        <section className="relative overflow-hidden bg-slate-50 pt-16 md:pt-20 lg:pt-28 pb-20">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
                    <div className="space-y-8">
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
                            Talk to the right mentor in under <span className="text-blue-600">24 hours</span>
                        </h1>
                        <p className="text-lg text-slate-600 sm:text-xl max-w-lg">
                            Answer a few questions, match with vetted mentors, and book 1:1 video sessions for career and startup advice.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white gap-2" asChild>
                                <Link href="/find-mentor">
                                    Find a mentor <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100" asChild>
                                <Link href="/mentors">Browse mentors</Link>
                            </Button>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-slate-500 font-medium">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                <span>Vetted Experts</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                <span>On-demand booking</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative mx-auto w-full max-w-[500px] lg:max-w-none">
                        {/* Visual Container */}
                        <div className="relative rounded-2xl bg-white shadow-xl overflow-hidden border border-slate-200 aspect-[4/3] flex flex-col">
                            {/* Mock Browser Header */}
                            <div className="flex items-center gap-2 border-b bg-slate-50 px-4 py-3 shrink-0">
                                <div className="flex gap-1.5">
                                    <div className="h-3 w-3 rounded-full bg-red-400"></div>
                                    <div className="h-3 w-3 rounded-full bg-amber-400"></div>
                                    <div className="h-3 w-3 rounded-full bg-green-400"></div>
                                </div>
                            </div>
                            {/* Mock Content */}
                            <div className="p-6 space-y-6 flex-1 bg-slate-50/50 relative overflow-hidden">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <div className="h-8 w-32 bg-slate-200 rounded mb-2 animate-pulse"></div>
                                        <div className="h-4 w-48 bg-slate-300 rounded animate-pulse delay-75"></div>
                                    </div>
                                </div>
                                {/* Floating Cards */}
                                <div className="absolute top-24 left-8 right-8 space-y-4">
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 animate-in slide-in-from-bottom-2 duration-500">
                                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">SJ</div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 w-1/2 bg-slate-200 rounded"></div>
                                            <div className="h-3 w-3/4 bg-slate-100 rounded"></div>
                                        </div>
                                        <div className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">Available</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-700 delay-150">
                                        <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold shrink-0">MK</div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 w-1/2 bg-slate-200 rounded"></div>
                                            <div className="h-3 w-3/4 bg-slate-100 rounded"></div>
                                        </div>
                                        <div className="px-3 py-1 bg-slate-50 text-slate-500 text-xs font-medium rounded-full">Busy</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Background Blob Effects */}
                        <div className="absolute -z-10 -top-12 -right-12 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl"></div>
                        <div className="absolute -z-10 -bottom-12 -left-12 h-72 w-72 rounded-full bg-purple-400/20 blur-3xl"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}

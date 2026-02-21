'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function Hero() {
    return (
        <section className="relative overflow-hidden bg-slate-50 pt-16 md:pt-24 lg:pt-32 pb-20 md:pb-28">
            {/* Animated Background Gradients */}
            <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-blue-50 to-transparent pointer-events-none" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="grid gap-12 lg:grid-cols-2 lg:gap-12 items-center">
                    {/* Text Content */}
                    <div className="space-y-8 text-center lg:text-left">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/50 text-blue-700 text-sm font-medium border border-blue-200"
                        >
                            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
                            Now accepting new mentees
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl/tight"
                        >
                            Talk to the right mentor in under <span className="text-blue-600 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">24 hours</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-lg text-slate-600 sm:text-xl max-w-xl mx-auto lg:mx-0"
                        >
                            Answer a few questions, match with fully vetted industry leaders, and book 1:1 video sessions for career and startup advice.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                        >
                            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-200 transition-all hover:scale-105" asChild>
                                <Link href="/find-mentor">
                                    Find a mentor <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100 transition-all hover:scale-105" asChild>
                                <Link href="/mentors">Browse mentors</Link>
                            </Button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-sm text-slate-500 font-medium pt-4"
                        >
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                <span>Vetted Experts</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                <span>On-demand booking</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                <span>Secure video calls</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Interactive Visual Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2, type: 'spring' }}
                        className="relative mx-auto w-full max-w-[500px] lg:max-w-none mt-8 lg:mt-0"
                    >
                        <div className="relative rounded-2xl bg-white shadow-2xl shadow-indigo-100 overflow-hidden border border-slate-200 aspect-[4/3] flex flex-col group">
                            {/* Mock Browser Header */}
                            <div className="flex items-center gap-2 border-b bg-slate-50/80 backdrop-blur px-4 py-3 shrink-0">
                                <div className="flex gap-1.5">
                                    <div className="h-3 w-3 rounded-full bg-red-400"></div>
                                    <div className="h-3 w-3 rounded-full bg-amber-400"></div>
                                    <div className="h-3 w-3 rounded-full bg-green-400"></div>
                                </div>
                                <div className="ml-4 h-4 rounded-md bg-white border border-slate-200 flex-1 max-w-[200px]" />
                            </div>

                            {/* Mock Content */}
                            <div className="p-6 space-y-6 flex-1 bg-slate-50/30 relative overflow-hidden">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <div className="h-8 w-32 bg-slate-200 rounded-md mb-3 animate-pulse"></div>
                                        <div className="h-4 w-48 bg-slate-300 rounded animate-pulse delay-75"></div>
                                    </div>
                                </div>

                                {/* Floating Mentor Cards */}
                                <div className="absolute top-24 left-6 right-6 space-y-4">
                                    <motion.div
                                        animate={{ y: [0, -8, 0] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                        className="bg-white p-4 rounded-xl shadow-md shadow-slate-200/50 border border-slate-100 flex items-center gap-4 relative z-20"
                                    >
                                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0 text-lg border-2 border-white shadow-sm ring-2 ring-blue-50">SJ</div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 w-1/2 bg-slate-200 rounded"></div>
                                            <div className="h-3 w-3/4 bg-slate-100 rounded"></div>
                                        </div>
                                        <div className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-100">Available</div>
                                    </motion.div>

                                    <motion.div
                                        animate={{ y: [0, 8, 0] }}
                                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                        className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow border border-slate-100 flex items-center gap-4 relative z-10 scale-[0.98] opacity-90 translate-y-2"
                                    >
                                        <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold shrink-0 text-lg ring-2 ring-purple-50">MK</div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 w-1/2 bg-slate-200 rounded"></div>
                                            <div className="h-3 w-3/4 bg-slate-100 rounded"></div>
                                        </div>
                                        <div className="px-3 py-1 bg-slate-50 text-slate-500 text-xs font-semibold rounded-full border border-slate-200">Busy</div>
                                    </motion.div>
                                </div>
                            </div>
                        </div>

                        {/* Background Blob Effects */}
                        <div className="absolute -z-10 -top-12 -right-12 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl mix-blend-multiply animate-pulse"></div>
                        <div className="absolute -z-10 -bottom-12 -left-12 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl mix-blend-multiply animate-pulse delay-700"></div>
                        <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-purple-300/20 blur-3xl mix-blend-multiply"></div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

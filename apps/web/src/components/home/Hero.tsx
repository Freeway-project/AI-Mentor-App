'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Sparkles, ArrowRight, Star } from 'lucide-react';

export function Hero() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end center']
    });

    // Animate the SVG path stroke
    const pathLength = useTransform(scrollYProgress, [0, 0.8], [0, 1]);

    // Opacity for stepping stones sequentially
    const stone1Opacity = useTransform(scrollYProgress, [0.1, 0.2], [0.3, 1]);
    const stone2Opacity = useTransform(scrollYProgress, [0.3, 0.4], [0.3, 1]);
    const stone3Opacity = useTransform(scrollYProgress, [0.5, 0.6], [0.3, 1]);
    const stone4Opacity = useTransform(scrollYProgress, [0.7, 0.8], [0.3, 1]);

    // Scale for stones
    const stone1Scale = useTransform(scrollYProgress, [0.1, 0.2], [0.8, 1]);
    const stone2Scale = useTransform(scrollYProgress, [0.3, 0.4], [0.8, 1]);
    const stone3Scale = useTransform(scrollYProgress, [0.5, 0.6], [0.8, 1]);
    const stone4Scale = useTransform(scrollYProgress, [0.7, 0.8], [0.8, 1]);

    // Spark position moving along the path roughly
    const sparkY = useTransform(scrollYProgress, [0, 0.8], ['0%', '100%']);

    return (
        <section ref={containerRef} className="relative flex min-h-[150vh] flex-col overflow-hidden bg-transparent pb-32 pt-24 lg:pt-32"
        >
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
                <div className="absolute -top-40 -left-40 h-[700px] w-[700px] animate-pulse rounded-full bg-brand/8 blur-[120px]" />
                <div className="absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-brand-light/6 blur-[100px]" style={{ animationDelay: '1s' }} />
                <div className="absolute -bottom-20 left-1/3 h-[400px] w-[500px] rounded-full bg-brand/60 blur-[100px]" />
            </div>

            <div className="container mx-auto px-4 md:px-6 relative z-10 sticky top-32">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">

                    {/* Left Content Area (Sticky text) */}
                    <div className="space-y-8 text-center lg:text-left">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/8 px-4 py-2 text-sm font-semibold text-brand shadow-sm"
                        >
                            <Sparkles className="h-4 w-4 text-brand" />
                            Ignite your potential today
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="mx-auto max-w-2xl text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:mx-0"
                        >
                            The <span className="bg-gradient-to-r from-brand via-brand-light to-brand-lighter bg-clip-text text-transparent">guided path</span> to your next career breakthrough
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="mx-auto max-w-xl text-lg leading-relaxed text-slate-600 sm:text-xl lg:mx-0"
                        >
                            Don&apos;t wander in the dark. Match with an elite industry mentor who will illuminate the exact steps to reach your goals.
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.35 }}
                            className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
                        >
                            <Button size="lg" className="group gap-2 rounded-full bg-brand px-7 font-bold text-white shadow-[0_4px_20px_rgba(160, 120, 48,0.25)] transition-all hover:bg-brand-light hover:shadow-[0_6px_30px_rgba(160, 120, 48,0.35)]" asChild>
                                <Link href="/browse">
                                    Find a Mentor
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" className="rounded-full border-slate-300 bg-white text-slate-700 hover:border-brand/40 hover:bg-slate-50 hover:text-brand shadow-sm" asChild>
                                <Link href="/register">Become a Mentor</Link>
                            </Button>
                        </motion.div>

                        {/* Trust signal */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="flex items-center justify-center gap-2 text-sm text-slate-500 lg:justify-start"
                        >
                            <Star className="h-4 w-4 fill-brand text-brand" />
                            <Star className="h-4 w-4 fill-brand text-brand" />
                            <Star className="h-4 w-4 fill-brand text-brand" />
                            <Star className="h-4 w-4 fill-brand text-brand" />
                            <Star className="h-4 w-4 fill-brand text-brand" />
                            <span className="ml-1"><strong className="text-slate-800">4.9/5</strong> from 2,400+ sessions</span>
                        </motion.div>
                    </div>

                    {/* Right Interactive Visual Area */}
                    <div className="relative h-[600px] w-full max-w-lg mx-auto lg:ml-auto">
                        {/* The Spark (Mentor) */}
                        <motion.div
                            style={{ top: sparkY }}
                            className="absolute left-1/2 -ml-[2px] z-10 h-32 w-1 bg-gradient-to-b from-transparent via-brand to-transparent shadow-[0_0_20px_rgba(160, 120, 48,0.3)]"
                        />
                        <motion.div
                            style={{ top: sparkY }}
                            className="absolute left-[calc(50%-12px)] -mt-3 z-10 h-6 w-6 rounded-full bg-brand-light opacity-50 blur-sm"
                        />
                        <motion.div
                            style={{ top: sparkY }}
                            className="absolute left-[calc(50%-4px)] -mt-1 z-20 h-2 w-2 rounded-full bg-white shadow-[0_0_15px_#A07830] ring-2 ring-brand/30"
                        />

                        {/* Winding SVG Path */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 600" fill="none" preserveAspectRatio="xMidYMin slice">
                            {/* Faint background path */}
                            <path
                                d="M200 0 C200 100, 300 150, 300 250 C300 350, 100 400, 100 500 C100 550, 200 580, 200 600"
                                stroke="rgba(148, 163, 184, 0.5)"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeDasharray="8 8"
                            />
                            {/* Glowing drawn path */}
                            <motion.path
                                d="M200 0 C200 100, 300 150, 300 250 C300 350, 100 400, 100 500 C100 550, 200 580, 200 600"
                                stroke="url(#glowGradient)"
                                strokeWidth="6"
                                strokeLinecap="round"
                                style={{ pathLength }}
                                className="drop-shadow-[0_0_8px_rgba(160, 120, 48,0.3)]"
                            />
                            <defs>
                                <linearGradient id="glowGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#C9A85A" />
                                    <stop offset="50%" stopColor="#B8923C" />
                                    <stop offset="100%" stopColor="#A07830" />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* Stepping Stones */}
                        <div className="absolute inset-0 w-full h-full pointer-events-none">
                            {/* Stone 1: Clarity */}
                            <motion.div
                                style={{ opacity: stone1Opacity, scale: stone1Scale }}
                                className="absolute top-[80px] right-[40px] flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-lg shadow-slate-200/60 backdrop-blur-md md:right-[20px] lg:right-[60px]"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-brand/20 bg-brand/10 font-bold text-brand shadow-sm">1</div>
                                <div className="pr-2 font-semibold text-slate-800">Clarity</div>
                            </motion.div>

                            {/* Stone 2: Skills */}
                            <motion.div
                                style={{ opacity: stone2Opacity, scale: stone2Scale }}
                                className="absolute top-[220px] right-[10px] flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-lg shadow-slate-200/60 backdrop-blur-md md:-right-[20px] lg:right-[10px]"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-brand/20 bg-brand/10 font-bold text-brand shadow-sm">2</div>
                                <div className="pr-2 font-semibold text-slate-800">Skills</div>
                            </motion.div>

                            {/* Stone 3: Confidence */}
                            <motion.div
                                style={{ opacity: stone3Opacity, scale: stone3Scale }}
                                className="absolute top-[380px] flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-lg shadow-slate-200/60 backdrop-blur-md"
                            >
                                <div className="pl-2 font-semibold text-slate-800">Confidence</div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-brand/20 bg-brand/10 font-bold text-brand shadow-sm">3</div>
                            </motion.div>

                            {/* Stone 4: Success / CTA */}
                            <motion.div
                                style={{ opacity: stone4Opacity, scale: stone4Scale }}
                                className="absolute bottom-[20px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 pointer-events-auto"
                            >
                                <div className="text-sm font-bold uppercase tracking-widest text-brand drop-shadow-[0_0_4px_rgba(160, 120, 48,0.2)]">Success</div>
                                <Button size="lg" className="group gap-2 rounded-full bg-brand px-8 py-6 text-lg font-bold text-white shadow-[0_4px_24px_rgba(160, 120, 48,0.3)] transition-all hover:scale-105 hover:bg-brand-light hover:shadow-[0_8px_32px_rgba(160, 120, 48,0.4)]" asChild>
                                    <Link href="/find-mentor">
                                        Book Your Session
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </Button>
                            </motion.div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Scroll instruction marker */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-sm text-slate-400"
            >
                Scroll to explore the path
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-px h-12 bg-gradient-to-b from-slate-400 to-transparent"
                />
            </motion.div>
        </section>
    );
}

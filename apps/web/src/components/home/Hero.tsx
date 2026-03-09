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
        <section ref={containerRef} className="relative overflow-hidden pb-32 min-h-[150vh] flex flex-col pt-24 lg:pt-32 bg-slate-50"
        >
            {/* White base with subtle dots */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Subtle dot grid */}
                <div className="absolute inset-0 opacity-[0.4]" style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '36px 36px' }} />

                {/* Aurora blob 1 - violet */}
                <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-violet-300/40 blur-[120px] animate-pulse" />
                {/* Aurora blob 2 - fuchsia */}
                <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-fuchsia-300/30 blur-[100px]" style={{ animationDelay: '1s' }} />
                {/* Aurora blob 3 - violet accent bottom */}
                <div className="absolute -bottom-20 left-1/3 w-[500px] h-[400px] rounded-full bg-violet-300/40 blur-[100px]" />
                {/* Thin top accent line */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500/40 to-transparent" />
            </div>

            <div className="container mx-auto px-4 md:px-6 relative z-10 sticky top-32">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">

                    {/* Left Content Area (Sticky text) */}
                    <div className="space-y-8 text-center lg:text-left">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100/50 text-violet-700 text-sm font-medium border border-violet-200 shadow-sm"
                        >
                            <Sparkles className="w-4 h-4 text-violet-600" />
                            Ignite your potential today
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl max-w-2xl mx-auto lg:mx-0 leading-[1.15]"
                        >
                            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600">lighted path</span> to your next career breakthrough
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-lg text-slate-600 sm:text-xl max-w-xl mx-auto lg:mx-0 leading-relaxed"
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
                            <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-7 rounded-full shadow-[0_0_30px_rgba(139,92,246,0.2)] hover:shadow-[0_0_40px_rgba(139,92,246,0.4)] transition-all gap-2 group" asChild>
                                <Link href="/browse">
                                    Find a Mentor
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" className="border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400 hover:bg-slate-100 rounded-full" asChild>
                                <Link href="/register">Become a Mentor</Link>
                            </Button>
                        </motion.div>

                        {/* Trust signal */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="flex items-center gap-2 justify-center lg:justify-start text-sm text-slate-600"
                        >
                            <Star className="w-4 h-4 text-violet-500 fill-violet-500" />
                            <Star className="w-4 h-4 text-violet-500 fill-violet-500" />
                            <Star className="w-4 h-4 text-violet-500 fill-violet-500" />
                            <Star className="w-4 h-4 text-violet-500 fill-violet-500" />
                            <Star className="w-4 h-4 text-violet-500 fill-violet-500" />
                            <span className="ml-1"><strong className="text-slate-900">4.9/5</strong> from 2,400+ sessions</span>
                        </motion.div>
                    </div>

                    {/* Right Interactive Visual Area */}
                    <div className="relative h-[600px] w-full max-w-lg mx-auto lg:ml-auto">
                        {/* The Spark (Mentor) */}
                        <motion.div
                            style={{ top: sparkY }}
                            className="absolute left-1/2 -ml-[2px] w-1 h-32 bg-gradient-to-b from-transparent via-violet-600 to-transparent z-10 shadow-[0_0_20px_rgba(139,92,246,0.4)]"
                        />
                        <motion.div
                            style={{ top: sparkY }}
                            className="absolute left-[calc(50%-12px)] -mt-3 w-6 h-6 bg-violet-400 rounded-full blur-sm opacity-60 z-10"
                        />
                        <motion.div
                            style={{ top: sparkY }}
                            className="absolute left-[calc(50%-4px)] -mt-1 w-2 h-2 bg-white rounded-full shadow-[0_0_15px_#8b5cf6] z-20"
                        />

                        {/* Winding SVG Path */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 600" fill="none" preserveAspectRatio="xMidYMin slice">
                            {/* Faint background path */}
                            <path
                                d="M200 0 C200 100, 300 150, 300 250 C300 350, 100 400, 100 500 C100 550, 200 580, 200 600"
                                stroke="rgba(203, 213, 225, 0.6)"
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
                                className="drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]"
                            />
                            <defs>
                                <linearGradient id="glowGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#c4b5fd" />
                                    <stop offset="50%" stopColor="#8b5cf6" />
                                    <stop offset="100%" stopColor="#6d28d9" />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* Stepping Stones */}
                        <div className="absolute inset-0 w-full h-full pointer-events-none">
                            {/* Stone 1: Clarity */}
                            <motion.div
                                style={{ opacity: stone1Opacity, scale: stone1Scale }}
                                className="absolute top-[80px] right-[40px] md:right-[20px] lg:right-[60px] flex items-center gap-3 bg-white/80 backdrop-blur-md border border-slate-200 p-3 rounded-2xl shadow-xl shadow-slate-200/50"
                            >
                                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center border border-violet-200 text-violet-700 font-bold shadow-sm">1</div>
                                <div className="text-slate-900 font-medium pr-2">Clarity</div>
                            </motion.div>

                            {/* Stone 2: Skills */}
                            <motion.div
                                style={{ opacity: stone2Opacity, scale: stone2Scale }}
                                className="absolute top-[220px] right-[10px] md:-right-[20px] lg:right-[10px] flex items-center gap-3 bg-white/80 backdrop-blur-md border border-slate-200 p-3 rounded-2xl shadow-xl shadow-slate-200/50"
                            >
                                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center border border-violet-200 text-violet-700 font-bold shadow-sm">2</div>
                                <div className="text-slate-900 font-medium pr-2">Skills</div>
                            </motion.div>

                            {/* Stone 3: Confidence */}
                            <motion.div
                                style={{ opacity: stone3Opacity, scale: stone3Scale }}
                                className="absolute top-[380px] flex items-center gap-3 bg-white/80 backdrop-blur-md border border-slate-200 p-3 rounded-2xl shadow-xl shadow-slate-200/50"
                            >
                                <div className="text-slate-900 font-medium pl-2">Confidence</div>
                                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center border border-violet-200 text-violet-700 font-bold shadow-sm">3</div>
                            </motion.div>

                            {/* Stone 4: Success / CTA */}
                            <motion.div
                                style={{ opacity: stone4Opacity, scale: stone4Scale }}
                                className="absolute bottom-[20px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 pointer-events-auto"
                            >
                                <div className="text-violet-600 font-bold tracking-widest uppercase text-sm drop-shadow-[0_0_4px_rgba(139,92,246,0.3)]">Success</div>
                                <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-lg px-8 py-6 rounded-full shadow-[0_0_20px_rgba(139,92,246,0.2)] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] gap-2 group" asChild>
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
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500 text-sm"
            >
                Scroll to explore the path
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-px h-12 bg-gradient-to-b from-slate-500 to-transparent"
                />
            </motion.div>
        </section>
    );
}

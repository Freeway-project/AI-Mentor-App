'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Search, Calendar, Video, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function ProgressPath() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start center', 'end center']
    });

    // Animate the central vertical line height
    const pathHeight = useTransform(scrollYProgress, [0, 0.8], ['0%', '100%']);

    // Step 1: Find Mentor
    const step1Opacity = useTransform(scrollYProgress, [0.1, 0.2], [0.3, 1]);
    const step1Scale = useTransform(scrollYProgress, [0.1, 0.2], [0.8, 1]);
    const step1Color = useTransform(scrollYProgress, [0.1, 0.2], ['#1e293b', '#f59e0b']); // slate-800 to amber-500

    // Step 2: Pick Time
    const step2Opacity = useTransform(scrollYProgress, [0.4, 0.5], [0.3, 1]);
    const step2Scale = useTransform(scrollYProgress, [0.4, 0.5], [0.8, 1]);
    const step2Color = useTransform(scrollYProgress, [0.4, 0.5], ['#1e293b', '#f59e0b']);

    // Step 3: Book & Learn
    const step3Opacity = useTransform(scrollYProgress, [0.7, 0.8], [0.3, 1]);
    const step3Scale = useTransform(scrollYProgress, [0.7, 0.8], [0.8, 1]);
    const step3Color = useTransform(scrollYProgress, [0.7, 0.8], ['#1e293b', '#10b981']); // slate-800 to emerald-500

    // Final CTA Button
    const ctaScale = useTransform(scrollYProgress, [0.8, 0.9], [0, 1]);
    const ctaOpacity = useTransform(scrollYProgress, [0.8, 0.9], [0, 1]);

    return (
        <section className="py-24 bg-slate-950 relative overflow-hidden" ref={containerRef}>
            <div className="container mx-auto px-4 md:px-6">

                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Your Journey to Mastery
                    </h2>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Three simple steps between you and your next career breakthrough.
                    </p>
                </div>

                <div className="max-w-3xl mx-auto relative pl-8 md:pl-0">

                    {/* The Background Line (unfilled) */}
                    <div className="absolute left-[39px] md:left-1/2 md:-ml-[2px] top-0 bottom-24 w-1 bg-slate-800 rounded-full" />

                    {/* The Animated "Filling" Line */}
                    <motion.div
                        style={{ height: pathHeight }}
                        className="absolute left-[39px] md:left-1/2 md:-ml-[2px] top-0 w-1 bg-amber-500 rounded-full origin-top shadow-[0_0_15px_rgba(245,158,11,0.5)] z-0"
                    />

                    <div className="space-y-32 relative z-10 pb-32">

                        {/* Step 1 */}
                        <motion.div
                            style={{ opacity: step1Opacity, scale: step1Scale }}
                            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 md:gap-16 w-full group"
                        >
                            {/* Desktop: Text on Left */}
                            <div className="hidden md:block flex-1 text-right">
                                <h3 className="text-2xl font-bold text-white mb-2">1. Find Your Mentor</h3>
                                <p className="text-slate-400">Browse through vetted industry experts. Filter by skill, company, or role to find your perfect match.</p>
                            </div>

                            {/* Center Node */}
                            <motion.div
                                style={{ borderColor: step1Color, color: step1Color }}
                                className="w-12 h-12 rounded-full border-4 bg-slate-950 flex items-center justify-center shrink-0 shadow-lg relative z-20 transition-colors"
                            >
                                <Search className="w-5 h-5" />
                            </motion.div>

                            {/* Mobile: Text on Right */}
                            <div className="flex-1 md:text-left">
                                <h3 className="text-2xl font-bold text-white mb-2 md:hidden">1. Find Your Mentor</h3>
                                <p className="text-slate-400 md:hidden">Browse through vetted industry experts. Filter by skill, company, or role to find your perfect match.</p>
                                {/* Visual Card */}
                                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-sm md:w-[90%] md:ml-auto">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-500 font-bold shrink-0 text-lg">SJ</div>
                                        <div className="space-y-2 flex-1">
                                            <div className="h-4 w-24 bg-slate-700 rounded"></div>
                                            <div className="h-3 w-32 bg-slate-800 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Step 2 */}
                        <motion.div
                            style={{ opacity: step2Opacity, scale: step2Scale }}
                            className="flex flex-col md:flex-row-reverse items-start md:items-center justify-between gap-8 md:gap-16 w-full group"
                        >
                            {/* Desktop: Text on Right */}
                            <div className="hidden md:block flex-1 text-left">
                                <h3 className="text-2xl font-bold text-white mb-2">2. Pick a Time</h3>
                                <p className="text-slate-400">View real-time availability. Select a slot that works for your schedule without the back-and-forth emails.</p>
                            </div>

                            {/* Center Node */}
                            <motion.div
                                style={{ borderColor: step2Color, color: step2Color }}
                                className="w-12 h-12 rounded-full border-4 bg-slate-950 flex items-center justify-center shrink-0 shadow-lg relative z-20 transition-colors"
                            >
                                <Calendar className="w-5 h-5" />
                            </motion.div>

                            {/* Mobile: Text on Right */}
                            <div className="flex-1 text-left md:text-right">
                                <h3 className="text-2xl font-bold text-white mb-2 md:hidden">2. Pick a Time</h3>
                                <p className="text-slate-400 md:hidden">View real-time availability. Select a slot that works for your schedule without the back-and-forth emails.</p>
                                {/* Visual Card */}
                                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-sm md:w-[90%] md:mr-auto">
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="bg-slate-800 border border-slate-700 py-2 rounded text-center text-xs text-slate-400">9:00 AM</div>
                                        <div className="bg-amber-500 py-2 rounded text-center text-xs text-slate-950 font-bold shadow-md shadow-amber-500/20">10:00 AM</div>
                                        <div className="bg-slate-800 border border-slate-700 py-2 rounded text-center text-xs text-slate-400">11:00 AM</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Step 3 */}
                        <motion.div
                            style={{ opacity: step3Opacity, scale: step3Scale }}
                            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 md:gap-16 w-full group"
                        >
                            {/* Desktop: Text on Left */}
                            <div className="hidden md:block flex-1 text-right">
                                <h3 className="text-2xl font-bold text-white mb-2">3. Book & Learn</h3>
                                <p className="text-slate-400">Confirm your session to instantly get a Google Meet link. Join the call and start accelerating your growth.</p>
                            </div>

                            {/* Center Node */}
                            <motion.div
                                style={{ borderColor: step3Color, color: step3Color }}
                                className="w-12 h-12 rounded-full border-4 bg-slate-950 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.3)] relative z-20 transition-colors"
                            >
                                <Video className="w-5 h-5 flex-shrink-0 ml-0.5" />
                            </motion.div>

                            {/* Mobile: Text on Right */}
                            <div className="flex-1 md:text-left">
                                <h3 className="text-2xl font-bold text-white mb-2 md:hidden">3. Book & Learn</h3>
                                <p className="text-slate-400 md:hidden">Confirm your session to instantly get a Google Meet link. Join the call and start accelerating your growth.</p>
                                {/* Visual Card */}
                                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-sm md:w-[90%] md:ml-auto flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-500">
                                        <Video className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="h-3 w-1/2 bg-slate-700 rounded mb-2"></div>
                                        <div className="h-2 w-1/3 bg-slate-800 rounded"></div>
                                    </div>
                                    <div className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/20 font-bold rounded uppercase">Confirmed</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Final CTA Button */}
                    <motion.div
                        style={{ scale: ctaScale, opacity: ctaOpacity }}
                        className="absolute bottom-0 left-[39px] md:left-1/2 -ml-[100px] md:-ml-[120px] w-[200px] md:w-[240px] z-30"
                    >
                        <Button
                            size="lg"
                            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)] rounded-full h-14 text-lg font-bold group"
                            asChild
                        >
                            <Link href="/find-mentor">
                                Start Your Path
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                    </motion.div>
                </div>

            </div>
        </section>
    );
}

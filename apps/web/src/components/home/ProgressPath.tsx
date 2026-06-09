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
    const step1Color = useTransform(scrollYProgress, [0.1, 0.2], ['#1e293b', '#f59e0b']); // slate-800 to violet-500

    // Step 2: Pick Time
    const step2Opacity = useTransform(scrollYProgress, [0.4, 0.5], [0.3, 1]);
    const step2Scale = useTransform(scrollYProgress, [0.4, 0.5], [0.8, 1]);
    const step2Color = useTransform(scrollYProgress, [0.4, 0.5], ['#1e293b', '#f59e0b']);

    // Step 3: Book & Learn
    const step3Opacity = useTransform(scrollYProgress, [0.7, 0.8], [0.3, 1]);
    const step3Scale = useTransform(scrollYProgress, [0.7, 0.8], [0.8, 1]);
    const step3Color = useTransform(scrollYProgress, [0.7, 0.8], ['#1e293b', '#10b981']); // slate-800 to purple-500

    // Final CTA Button
    const ctaScale = useTransform(scrollYProgress, [0.8, 0.9], [0, 1]);
    const ctaOpacity = useTransform(scrollYProgress, [0.8, 0.9], [0, 1]);

    return (
        <section className="relative overflow-hidden bg-transparent py-24" ref={containerRef}>
            <div className="container mx-auto px-4 md:px-6">

                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                        Your Journey to Mastery
                    </h2>
                    <p className="mx-auto max-w-2xl text-lg text-slate-600">
                        Three simple steps between you and your next career breakthrough.
                    </p>
                </div>

                <div className="max-w-3xl mx-auto relative pl-8 md:pl-0">

                    {/* The Background Line (unfilled) */}
                    <div className="absolute left-[39px] top-0 bottom-24 w-1 rounded-full bg-slate-200 md:left-1/2 md:-ml-[2px]" />

                    {/* The Animated "Filling" Line */}
                    <motion.div
                        style={{ height: pathHeight }}
                        className="absolute left-[39px] top-0 z-0 w-1 origin-top rounded-full bg-brand shadow-[0_0_15px_rgba(124,58,237,0.3)] md:left-1/2 md:-ml-[2px]"
                    />

                    <div className="space-y-32 relative z-10 pb-32">

                        {/* Step 1 */}
                        <motion.div
                            style={{ opacity: step1Opacity, scale: step1Scale }}
                            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 md:gap-16 w-full group"
                        >
                            {/* Desktop: Text on Left */}
                            <div className="hidden md:block flex-1 text-right">
                                <h3 className="mb-2 text-2xl font-bold text-slate-900">1. Find Your Mentor</h3>
                                <p className="text-slate-600">Browse through vetted industry experts. Filter by skill, company, or role to find your perfect match.</p>
                            </div>

                            {/* Center Node */}
                            <motion.div
                                style={{ borderColor: step1Color, color: step1Color }}
                                className="relative z-20 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 bg-white shadow-md transition-colors"
                            >
                                <Search className="w-5 h-5" />
                            </motion.div>

                            {/* Mobile: Text on Right */}
                            <div className="flex-1 md:text-left">
                                <h3 className="mb-2 text-2xl font-bold text-slate-900 md:hidden">1. Find Your Mentor</h3>
                                <p className="text-slate-600 md:hidden">Browse through vetted industry experts. Filter by skill, company, or role to find your perfect match.</p>
                                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:ml-auto md:w-[90%]">
                                    <div className="flex gap-4 items-center">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/10 text-lg font-bold text-brand">SJ</div>
                                        <div className="space-y-2 flex-1">
                                            <div className="h-4 w-24 rounded bg-slate-200"></div>
                                            <div className="h-3 w-32 rounded bg-slate-100"></div>
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
                                <h3 className="mb-2 text-2xl font-bold text-slate-900">2. Pick a Time</h3>
                                <p className="text-slate-600">View real-time availability. Select a slot that works for your schedule without the back-and-forth emails.</p>
                            </div>

                            {/* Center Node */}
                            <motion.div
                                style={{ borderColor: step2Color, color: step2Color }}
                                className="relative z-20 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 bg-white shadow-md transition-colors"
                            >
                                <Calendar className="w-5 h-5" />
                            </motion.div>

                            {/* Mobile: Text on Right */}
                            <div className="flex-1 text-left md:text-right">
                                <h3 className="mb-2 text-2xl font-bold text-slate-900 md:hidden">2. Pick a Time</h3>
                                <p className="text-slate-600 md:hidden">View real-time availability. Select a slot that works for your schedule without the back-and-forth emails.</p>
                                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:mr-auto md:w-[90%]">
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="rounded border border-slate-200 bg-slate-100 py-2 text-center text-xs text-slate-500">9:00 AM</div>
                                        <div className="rounded bg-brand py-2 text-center text-xs font-bold text-white shadow-md shadow-brand/20">10:00 AM</div>
                                        <div className="rounded border border-slate-200 bg-slate-100 py-2 text-center text-xs text-slate-500">11:00 AM</div>
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
                                <h3 className="mb-2 text-2xl font-bold text-slate-900">3. Book & Learn</h3>
                                <p className="text-slate-600">Confirm your session to instantly get a Google Meet link. Join the call and start accelerating your growth.</p>
                            </div>

                            {/* Center Node */}
                            <motion.div
                                style={{ borderColor: step3Color, color: step3Color }}
                                className="relative z-20 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 bg-white shadow-[0_0_15px_rgba(124,58,237,0.15)] transition-colors"
                            >
                                <Video className="w-5 h-5 flex-shrink-0 ml-0.5" />
                            </motion.div>

                            {/* Mobile: Text on Right */}
                            <div className="flex-1 md:text-left">
                                <h3 className="mb-2 text-2xl font-bold text-slate-900 md:hidden">3. Book & Learn</h3>
                                <p className="text-slate-600 md:hidden">Confirm your session to instantly get a Google Meet link. Join the call and start accelerating your growth.</p>
                                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:ml-auto md:w-[90%]">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                                        <Video className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="mb-2 h-3 w-1/2 rounded bg-slate-200"></div>
                                        <div className="h-2 w-1/3 rounded bg-slate-100"></div>
                                    </div>
                                    <div className="rounded border border-brand/20 bg-brand/10 px-2 py-1 text-[10px] font-bold uppercase text-brand">Confirmed</div>
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
                            className="group h-14 w-full rounded-full bg-brand text-lg font-bold text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:bg-brand-light"
                            asChild
                        >
                            <Link href="/browse">
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

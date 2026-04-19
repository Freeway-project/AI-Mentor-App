'use client';

import Image from 'next/image';
import { UserPlus, Search, Calendar, Repeat, ArrowRight } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

const steps = [
    {
        title: 'Tell us your goals',
        description: 'Share your background, current challenges, and what you hope to achieve. We use this to understand your unique learning path.',
        icon: UserPlus,
        color: 'text-brand',
        bgColor: 'bg-brand/10',
        borderColor: 'border-brand/20',
    },
    {
        title: 'Get matched',
        description: 'Our system connects you with industry experts whose experience aligns perfectly with your specific growth needs.',
        icon: Search,
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/20',
    },
    {
        title: 'Schedule Session',
        description: 'Find a time that works. Book a 1:1 video call directly on their calendar without any back-and-forth messaging.',
        icon: Calendar,
        color: 'text-brand',
        bgColor: 'bg-brand/10',
        borderColor: 'border-brand/20',
    },
    {
        title: 'Learn & Iterate',
        description: 'Get actionable advice, apply it, and book follow-ups to track your progress and tackle new challenges.',
        icon: Repeat,
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/20',
    },
];

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring' as const, stiffness: 200, damping: 20 }
    }
};

export function HowItWorks() {
    return (
        <section id="how-it-works" className="relative overflow-hidden bg-transparent py-20 md:py-32">
            <div className="pointer-events-none absolute right-0 top-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-brand/10 blur-3xl opacity-70"></div>
            <div className="pointer-events-none absolute bottom-0 left-0 -mb-20 -ml-20 h-96 w-96 rounded-full bg-brand-light/10 blur-3xl opacity-60"></div>

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16 md:mb-24 space-y-4"
                >
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
                        Your Journey to Mastery
                    </h2>
                    <p className="mx-auto max-w-2xl text-lg text-slate-600">
                        We&apos;ve streamlined the mentorship process. Getting expert guidance has never been this simple and effective.
                    </p>
                </motion.div>

                <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center max-w-6xl mx-auto">

                    {/* Visual Journey Output */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                        className="relative order-last lg:order-first hidden md:block"
                    >
                        <div className="relative aspect-square md:aspect-auto md:h-[600px] w-full max-w-md mx-auto">
                            {/* Central Orbit Anchor */}
                            <div className="absolute top-1/2 left-1/2 z-20 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
                                <span className="text-center text-xl font-bold leading-tight text-slate-800">Growth<br />Engine</span>
                            </div>

                            {/* Animated Rings */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                                className="absolute top-1/2 left-1/2 z-10 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-slate-300"
                            >
                                <div className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand shadow-[0_0_15px_rgba(160, 120, 48,0.5)]"></div>
                            </motion.div>

                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                                className="absolute top-1/2 left-1/2 z-0 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200"
                            >
                                <div className="absolute bottom-0 left-1/2 flex h-6 w-6 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full bg-brand-light shadow-[0_0_15px_rgba(160, 120, 48,0.5)]">
                                    <div className="w-2 h-2 rounded-full bg-white"></div>
                                </div>
                                <div className="absolute right-0 top-1/2 h-3 w-3 translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-lighter shadow-sm"></div>
                            </motion.div>

                            {/* Decorative Floating Nodes */}
                            <motion.div
                                animate={{ y: [0, -15, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute right-0 top-12 z-30 flex items-center gap-3 rounded-xl border border-slate-200 bg-white/90 p-3 shadow-md"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10">
                                    <span className="text-xs font-bold text-brand">1:1</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="h-2 w-16 rounded bg-slate-200"></div>
                                    <div className="h-1.5 w-10 rounded bg-slate-100"></div>
                                </div>
                            </motion.div>

                            <motion.div
                                animate={{ y: [0, 10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                className="absolute bottom-16 left-0 z-30 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-lg"
                            >
                                <div className="relative">
                                    <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100 shadow-sm ring-2 ring-white">
                                        <Image src="https://i.pravatar.cc/150?img=11" alt="Student" width={48} height={48} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-brand">
                                        <ArrowRight className="w-3 h-3 text-white -rotate-45" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">Career breakthrough</p>
                                    <p className="text-xs text-brand">Achieved in 3 months</p>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Step-by-Step List */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        className="space-y-8 lg:pl-10"
                    >
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <motion.div
                                    key={index}
                                    variants={itemVariants}
                                    className="relative flex gap-6 group"
                                >
                                    {/* Connecting Line */}
                                    {index !== steps.length - 1 && (
                                        <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-slate-200 group-hover:bg-brand-light transition-colors -mb-8"></div>
                                    )}

                                    {/* Icon Container */}
                                    <div className="relative shrink-0">
                                        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border bg-white shadow-sm transition-all duration-300 group-hover:scale-110 ${step.bgColor} ${step.borderColor}`}>
                                            <Icon className="h-7 w-7 text-brand" strokeWidth={2.5} />
                                        </div>
                                        <div className="absolute -right-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-brand shadow-sm">
                                            <span className="text-xs font-bold text-white">{index + 1}</span>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <h3 className="mb-2 text-xl font-bold text-slate-900 transition-colors group-hover:text-brand">
                                            {step.title}
                                        </h3>
                                        <p className="text-base leading-relaxed text-slate-600">
                                            {step.description}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

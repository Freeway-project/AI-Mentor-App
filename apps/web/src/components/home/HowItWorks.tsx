'use client';

import Image from 'next/image';
import { UserPlus, Search, Calendar, Repeat, ArrowRight } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

const steps = [
    {
        title: 'Tell us your goals',
        description: 'Share your background, current challenges, and what you hope to achieve. We use this to understand your unique learning path.',
        icon: UserPlus,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
    },
    {
        title: 'Get matched',
        description: 'Our system connects you with industry experts whose experience aligns perfectly with your specific growth needs.',
        icon: Search,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
    },
    {
        title: 'Schedule Session',
        description: 'Find a time that works. Book a 1:1 video call directly on their calendar without any back-and-forth messaging.',
        icon: Calendar,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
    },
    {
        title: 'Learn & Iterate',
        description: 'Get actionable advice, apply it, and book follow-ups to track your progress and tackle new challenges.',
        icon: Repeat,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
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
        <section id="how-it-works" className="py-20 md:py-32 bg-slate-900 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16 md:mb-24 space-y-4"
                >
                    <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
                        Your Journey to Mastery
                    </h2>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
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
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center shadow-2xl shadow-amber-900/20 z-20 border border-slate-700">
                                <span className="text-white font-bold text-xl text-center leading-tight">Growth<br />Engine</span>
                            </div>

                            {/* Animated Rings */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-dashed border-slate-700 z-10"
                            >
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
                            </motion.div>

                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full border border-slate-800 z-0"
                            >
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-6 h-6 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-slate-900"></div>
                                </div>
                                <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-400 shadow-md"></div>
                            </motion.div>

                            {/* Decorative Floating Nodes */}
                            <motion.div
                                animate={{ y: [0, -15, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-12 right-0 bg-slate-800 p-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-3 z-30"
                            >
                                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <span className="text-emerald-400 text-xs font-bold">1:1</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="h-2 w-16 bg-slate-600 rounded"></div>
                                    <div className="h-1.5 w-10 bg-slate-700 rounded"></div>
                                </div>
                            </motion.div>

                            <motion.div
                                animate={{ y: [0, 10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                className="absolute bottom-16 left-0 bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-700 z-30 flex gap-4 items-center"
                            >
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-700 shadow-sm ring-2 ring-slate-800 bg-slate-900">
                                        <Image src="https://i.pravatar.cc/150?img=11" alt="Student" width={48} height={48} className="w-full h-full object-cover opacity-80" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-slate-800 flex items-center justify-center">
                                        <ArrowRight className="w-3 h-3 text-slate-900 -rotate-45" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Career breakthrough</p>
                                    <p className="text-xs text-emerald-400">Achieved in 3 months</p>
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
                                        <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-slate-800 group-hover:bg-slate-700 transition-colors -mb-8"></div>
                                    )}

                                    {/* Icon Container */}
                                    <div className="relative shrink-0">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${step.bgColor} ${step.borderColor} shadow-sm group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all duration-300 bg-slate-900`}>
                                            <Icon className={`w-7 h-7 ${step.color}`} strokeWidth={2.5} />
                                        </div>
                                        {/* Number Badge */}
                                        <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center shadow-sm">
                                            <span className="text-white text-xs font-bold">{index + 1}</span>
                                        </div>
                                    </div>

                                    {/* Text Content */}
                                    <div className="pt-2">
                                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-500 transition-colors">
                                            {step.title}
                                        </h3>
                                        <p className="text-slate-400 leading-relaxed text-base">
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


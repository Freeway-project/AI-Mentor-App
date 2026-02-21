'use client';

import Image from 'next/image';
import { UserPlus, Search, Calendar, Repeat, ArrowRight } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

const steps = [
    {
        title: 'Tell us your goals',
        description: 'Share your background, current challenges, and what you hope to achieve. We use this to understand your unique learning path.',
        icon: UserPlus,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
    },
    {
        title: 'Get matched',
        description: 'Our system connects you with industry experts whose experience aligns perfectly with your specific growth needs.',
        icon: Search,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-200',
    },
    {
        title: 'Schedule Session',
        description: 'Find a time that works. Book a 1:1 video call directly on their calendar without any back-and-forth messaging.',
        icon: Calendar,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
    },
    {
        title: 'Learn & Iterate',
        description: 'Get actionable advice, apply it, and book follow-ups to track your progress and tackle new challenges.',
        icon: Repeat,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
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
        <section id="how-it-works" className="py-20 md:py-32 bg-white relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-purple-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

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
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
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
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-slate-900 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-200 z-20">
                                <span className="text-white font-bold text-xl text-center leading-tight">Growth<br />Engine</span>
                            </div>

                            {/* Animated Rings */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-dashed border-slate-300 z-10"
                            >
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-500 shadow-lg shadow-blue-200"></div>
                            </motion.div>

                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full border border-slate-200 z-0"
                            >
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-6 h-6 rounded-full bg-purple-500 shadow-lg shadow-purple-200 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-white"></div>
                                </div>
                                <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-400 shadow-md"></div>
                            </motion.div>

                            {/* Decorative Floating Nodes */}
                            <motion.div
                                animate={{ y: [0, -15, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-12 right-0 bg-white p-3 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3 z-30"
                            >
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                    <span className="text-green-600 text-xs font-bold">1:1</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="h-2 w-16 bg-slate-200 rounded"></div>
                                    <div className="h-1.5 w-10 bg-slate-100 rounded"></div>
                                </div>
                            </motion.div>

                            <motion.div
                                animate={{ y: [0, 10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                className="absolute bottom-16 left-0 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 z-30 flex gap-4 items-center"
                            >
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm ring-2 ring-slate-100">
                                        <Image src="https://i.pravatar.cc/150?img=11" alt="Student" width={48} height={48} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                        <ArrowRight className="w-3 h-3 text-white -rotate-45" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">Career breakthrough</p>
                                    <p className="text-xs text-slate-500">Achieved in 3 months</p>
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
                                        <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-slate-200 group-hover:bg-slate-300 transition-colors -mb-8"></div>
                                    )}

                                    {/* Icon Container */}
                                    <div className="relative shrink-0">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${step.bgColor} ${step.borderColor} shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300`}>
                                            <Icon className={`w-7 h-7 ${step.color}`} strokeWidth={2.5} />
                                        </div>
                                        {/* Number Badge */}
                                        <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center shadow-sm">
                                            <span className="text-white text-xs font-bold">{index + 1}</span>
                                        </div>
                                    </div>

                                    {/* Text Content */}
                                    <div className="pt-2">
                                        <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                                            {step.title}
                                        </h3>
                                        <p className="text-slate-600 leading-relaxed text-base">
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


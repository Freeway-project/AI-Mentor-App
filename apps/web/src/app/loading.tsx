'use client';

import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';

export default function Loading() {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
            style={{ background: 'var(--gradient-page)' }}
        >
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
                <div className="absolute top-8 right-8 h-[28rem] w-[28rem] rounded-full bg-brand/10 blur-[120px]" />
                <div className="absolute bottom-0 left-[-6rem] h-[20rem] w-[20rem] rounded-full bg-brand-light/10 blur-[120px]" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent" />
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center space-y-4 rounded-3xl border border-white/10 bg-slate-900/50 px-10 py-9 backdrop-blur-md">
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="relative flex h-20 w-20 items-center justify-center rounded-full border border-brand/20 bg-brand/10 shadow-lg shadow-slate-950/40"
                >
                    <GraduationCap className="h-10 w-10 text-brand-lighter" />

                    <motion.div
                        className="absolute inset-0 rounded-full border-4 border-brand border-t-transparent"
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />
                </motion.div>
                <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                    <p className="text-lg font-semibold tracking-wide text-white">
                        Loading next page...
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

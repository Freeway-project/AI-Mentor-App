'use client';

import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';

export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm">
            <div className="flex flex-col items-center justify-center space-y-4">
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
                    className="relative flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 shadow-lg border border-blue-200"
                >
                    <GraduationCap className="h-10 w-10 text-blue-600" />

                    <motion.div
                        className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent"
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
                    <p className="text-lg font-semibold text-slate-700 tracking-wide">
                        Loading Mentor HQ...
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

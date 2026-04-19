'use client';

import { BrandLoader } from '@/components/brand/brand-loader';

export default function Loading() {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
            style={{ background: 'var(--gradient-auth)' }}
        >
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
                <div className="absolute top-8 right-8 h-[28rem] w-[28rem] rounded-full bg-brand/10 blur-[120px]" />
                <div className="absolute bottom-0 left-[-6rem] h-[20rem] w-[20rem] rounded-full bg-brand-light/10 blur-[120px]" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent" />
            </div>

            <div className="relative z-10 rounded-3xl border border-white/10 bg-slate-900/50 px-10 py-9 backdrop-blur-md">
                <BrandLoader />
            </div>
        </div>
    );
}

'use client';

import { BrandLoader } from '@/components/brand/brand-loader';

export default function Loading() {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
            style={{ background: 'var(--gradient-auth)' }}
        >
            <div className="absolute inset-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #d97706 1px, transparent 1px)',
                        backgroundSize: '32px 32px',
                    }}
                />
                <div className="absolute top-8 right-8 h-[24rem] w-[24rem] rounded-full bg-amber-200/25 blur-[100px]" />
                <div className="absolute bottom-0 left-[-5rem] h-[18rem] w-[18rem] rounded-full bg-amber-100/40 blur-[90px]" />
            </div>

            <div className="relative z-10 rounded-3xl border border-amber-100/90 bg-white/95 px-10 py-9 shadow-xl shadow-amber-950/5 backdrop-blur-sm">
                <BrandLoader />
            </div>
        </div>
    );
}

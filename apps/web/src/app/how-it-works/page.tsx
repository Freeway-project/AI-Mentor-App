import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HowItWorks } from '@/components/home/HowItWorks';
import { ProgressPath } from '@/components/home/ProgressPath';
import { FAQ } from '@/components/home/FAQ';
import { AppPageShell, AppPanel, appTheme } from '@/components/ui/app-theme';

export default function HowItWorksPage() {
  return (
    <AppPageShell dark>
      <Navbar />

      <main className={appTheme.content}>
        <section className="container mx-auto px-4 pb-8 pt-16 md:px-6 md:pt-24">
          <AppPanel className="mx-auto max-w-5xl overflow-hidden p-8 md:p-12">
            <div className="space-y-6 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-lighter">
                How It Works
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
                A clear path from discovery to booked mentorship
              </h1>
              <p className="mx-auto max-w-3xl text-base leading-relaxed text-slate-300 md:text-lg">
                Tell us your goals and our AI builds a personalised career plan, then matches you with
                the right mentors. Pick a time that suits you, book your session, and join the call —
                guidance and next steps in one simple flow.
              </p>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/browse"
                  className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-light"
                >
                  Browse Mentors
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/40 px-6 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-900/70 hover:text-white"
                >
                  Become a Mentor
                </Link>
              </div>
            </div>
          </AppPanel>
        </section>

        <HowItWorks />
        <ProgressPath />
        <FAQ />
      </main>

      <Footer />
    </AppPageShell>
  );
}

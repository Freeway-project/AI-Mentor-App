import { Navbar } from '@/components/layout/Navbar';
import { Hero } from '@/components/home/Hero';
import { HowItWorks } from '@/components/home/HowItWorks';
import { MentorHighlights } from '@/components/home/MentorHighlights';
import { SocialProof } from '@/components/home/SocialProof';
import { ProgressPath } from '@/components/home/ProgressPath';
import { FAQ } from '@/components/home/FAQ';
import { Footer } from '@/components/layout/Footer';
import { AppPageShell } from '@/components/ui/app-theme';

export default function Home() {
  return (
    <AppPageShell>
      <Navbar />
      <Hero />
      <HowItWorks />
      <MentorHighlights />
      <SocialProof />
      <ProgressPath />
      <FAQ />
      <Footer />
    </AppPageShell>
  );
}

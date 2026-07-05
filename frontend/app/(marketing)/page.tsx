import { LandingNavbar } from "@/components/landing/navbar";
import { LandingHero } from "@/components/landing/hero";
import { LandingProblem } from "@/components/landing/problem";
import { LandingFeatures } from "@/components/landing/features";
import { LandingWorkflow } from "@/components/landing/workflow";
import { LandingWhyCognee } from "@/components/landing/why-cognee";
import { LandingFaq } from "@/components/landing/faq";
import { LandingCta } from "@/components/landing/cta";
import { LandingFooter } from "@/components/landing/footer";

export default function MarketingPage() {
  return (
    <div className="page-shell min-h-screen bg-white">
      <LandingNavbar />
      <main>
        <LandingHero />
        <LandingProblem />
        <LandingFeatures />
        <LandingWorkflow />
        <LandingWhyCognee />
        <LandingFaq />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}

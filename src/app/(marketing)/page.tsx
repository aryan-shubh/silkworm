import { Hero } from "@/components/marketing/hero";
import { TerminalDemo } from "@/components/marketing/terminal-demo";
import { FeatureBand } from "@/components/marketing/feature-band";
import { SocialProof } from "@/components/marketing/social-proof";
import { Faq } from "@/components/marketing/faq";

export default function Landing() {
  return (
    <>
      <Hero />
      <TerminalDemo />
      <FeatureBand />
      <SocialProof />
      <Faq />
    </>
  );
}

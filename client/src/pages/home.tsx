import { HeroSection } from "@/components/hero-section";
import { CoinCalculator } from "@/components/coin-calculator";
import { FeaturesSection } from "@/components/features-section";
import { ServersSection } from "@/components/servers-section";
import { FaqSection } from "@/components/faq-section";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <CoinCalculator />
      <FeaturesSection />
      <ServersSection />
      <FaqSection />
      <Footer />
    </div>
  );
}

import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { InfoBar } from './components/InfoBar';
import { AboutHeritageSection } from './components/AboutHeritageSection';
import { FaithCommunitySection } from './components/FaithCommunitySection';
import { CelebrateSection } from './components/CelebrateSection';
import { ArtistsSection } from './components/ArtistsSection';
import { SponsorshipSection } from './components/SponsorshipSection';
import { SecureSeatSection } from './components/SecureSeatSection';
import { FooterSection } from './components/FooterSection';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CheckoutProvider } from './components/CheckoutProvider';
import { SECTION } from './config/site';

function App() {
  return (
    <ErrorBoundary>
      {/* Owns the price list, the checkout form and the post-payment status
          view. Wraps the page so any call to action can start a checkout. */}
      <CheckoutProvider>
        <div className="min-h-screen bg-white font-['Outfit',sans-serif] overflow-x-hidden">
          {/* ── Navbar ── */}
          <Navbar />

          {/* ── Hero — full-bleed dark maroon section ── */}
          <div id={SECTION.home} style={{ background: "#34100b" }}>
            <Hero />
            {/* InfoBar overlaps the hero bottom — needs a light bg wrapper to emerge from */}
            <div style={{ background: "#34100b", paddingBottom: "80px" }}>
              <InfoBar />
            </div>
          </div>

          {/* ── Celebrate Diwali section (white bg) ── */}
          <CelebrateSection />

          {/* ── Unified Artists & Sponsorship Section (dark bg container) ── */}
          <div className="bg-[#24313b]">
            <ArtistsSection />
            <SponsorshipSection />
          </div>

          <FaithCommunitySection />

          <AboutHeritageSection />

          <SecureSeatSection />

          {/* ── Footer ── */}
          <FooterSection />
        </div>
      </CheckoutProvider>
    </ErrorBoundary>
  );
}

export default App;

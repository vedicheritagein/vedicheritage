import { useState } from 'react';
import logoImg from '../assets/logo.webp';
import { SECTION } from '../config/site';
import { useBookTickets } from '../lib/booking';
import { scrollToSection, useActiveSection } from '../lib/navigation';

const NAV_LINKS = [
  { label: 'Home', section: SECTION.home },
  { label: 'Artist', section: SECTION.artists },
  { label: 'About the event', section: SECTION.aboutEvent },
  { label: 'Sponsorship', section: SECTION.sponsorship },
] as const;

/** Stable identity: this feeds a hook dependency list. */
const NAV_SECTIONS = NAV_LINKS.map((l) => l.section);

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const activeSection = useActiveSection(NAV_SECTIONS);
  const bookTickets = useBookTickets();

  /**
   * Real hrefs are kept on the anchors so the links remain middle-clickable and
   * show a destination in the status bar; the handler only takes over to add
   * smooth scrolling and to close the mobile menu.
   */
  const handleNav = (event: React.MouseEvent<HTMLAnchorElement>, section: string) => {
    event.preventDefault();
    setMenuOpen(false);
    scrollToSection(section);
  };

  /**
   * Open the ticket form.
   *
   * Previously this scrolled to the tickets section, so the button furthest up
   * the page - and the one most visitors reach for first - did not actually
   * start a booking. The mobile menu is closed first, or the form would open
   * behind it.
   */
  const handleBookNow = () => {
    setMenuOpen(false);
    bookTickets();
  };

  return (
    <nav className="bg-white shadow-[0_1px_8px_rgba(0,0,0,0.07)] relative z-40">
      <div className="max-w-[1280px] mx-auto px-8 flex items-center justify-between h-[70px]">
        {/* ── Logo + Brand Name ── */}
        <div className="flex items-center gap-3">
          <img
            src={logoImg}
            alt="Vedic Heritage Logo"
            width={155}
            height={156}
            className="w-12 h-12 object-contain"
          />
          <div className="leading-[1.2]">
            <div className="text-[15px] font-black text-[#c97d1e] tracking-[0.12em] font-['Outfit',sans-serif]">
              VEDIC HERITAGE
            </div>
            <div className="text-[8.5px] font-bold text-gray-400 tracking-[0.28em] mt-px uppercase font-['Outfit',sans-serif]">
              HANUMAN MANDIR
            </div>
          </div>
        </div>

        {/* ── Desktop Nav Links ── */}
        <div className="hidden md:flex items-center gap-9">
          {NAV_LINKS.map(({ label, section }) => {
            const active = activeSection === section;
            return (
              <a
                key={label}
                href={`#${section}`}
                onClick={(e) => handleNav(e, section)}
                aria-current={active ? 'true' : undefined}
                className={`text-[13.5px] font-semibold tracking-[0.01em] font-['Outfit',sans-serif] transition-colors duration-200 no-underline ${
                  active ? 'text-[#e98314]' : 'text-gray-600 hover:text-[#e98314]'
                }`}
              >
                {label}
              </a>
            );
          })}

          {/* Book Now button */}
          <button
            type="button"
            onClick={handleBookNow}
            className="bg-[#e98314] text-white border-none rounded-full px-6 py-2.5 text-[13px] font-bold tracking-[0.04em] cursor-pointer font-['Outfit',sans-serif] shadow-[0_4px_16px_rgba(233,131,20,0.38)] transition-all duration-200 hover:bg-[#d07210] hover:-translate-y-px"
          >
            Book Now
          </button>
        </div>

        {/* ── Mobile Hamburger ── */}
        <button
          type="button"
          className="md:hidden bg-transparent border-none cursor-pointer p-1.5"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          <div className="w-[22px] h-[2px] bg-gray-600 mb-[5px] rounded-[2px]" />
          <div className="w-[22px] h-[2px] bg-gray-600 mb-[5px] rounded-[2px]" />
          <div className="w-[22px] h-[2px] bg-gray-600 rounded-[2px]" />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="bg-white border-t border-gray-100 py-4 px-8 flex flex-col gap-3.5 md:hidden"
        >
          {NAV_LINKS.map(({ label, section }) => (
            <a
              key={label}
              href={`#${section}`}
              onClick={(e) => handleNav(e, section)}
              className={`text-sm font-semibold no-underline ${
                activeSection === section ? 'text-[#e98314]' : 'text-gray-600'
              }`}
            >
              {label}
            </a>
          ))}
          <button
            type="button"
            onClick={handleBookNow}
            className="bg-[#e98314] text-white border-none rounded-full px-6 py-2.5 text-[13px] font-bold cursor-pointer self-start"
          >
            Book Now
          </button>
        </div>
      )}
    </nav>
  );
}

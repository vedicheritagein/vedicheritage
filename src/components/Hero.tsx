
import heroBg from '../assets/hero_background.webp';
import artistsImg from '../assets/image 3.webp';
import logoImg from '../assets/logo.webp';
import { useBookTickets } from '../lib/booking';

export function Hero() {
  // Opens the ticket form directly. It used to scroll to the tickets section,
  // which left the visitor to find a second button to actually book.
  const bookTickets = useBookTickets();

  return (
    <div className="bg-white">
      <section className="relative overflow-hidden w-full min-h-[680px] md:min-h-0 md:h-[580px]">
        {/* ── Background temple image ── */}
        {/* Intrinsic size given so the browser reserves the box before decode.
            The CSS below fully determines the rendered size either way. */}
        <img
          src={heroBg}
          alt=""
          width={1344}
          height={768}
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* ── Dark maroon overlay ── */}
        <div className="absolute inset-0" style={{ background: 'rgba(52, 10, 5, 0.78)' }} />

        {/* ── Bottom gradient fade ── */}
        <div className="absolute bottom-0 left-0 right-0 h-[160px] pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(30,6,3,0.9) 0%, transparent 100%)' }}
        />

        {/* ── HERO CONTENT ROW ── */}
        <div className="relative z-10 h-full max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center md:items-start pt-10 px-6 gap-6 md:gap-0">
          {/* LEFT — Text block */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left w-full md:max-w-[52%]">
            {/* Main headline */}
            <h1 className="m-0 p-0 mb-5 font-normal leading-[1.05] text-[#f2c45a]"
              style={{
                fontFamily: '"Alga", "Bodoni Moda", "Playfair Display", Georgia, serif',
                fontSize: 'clamp(38px, 5vw, 64px)',
              }}>
              Annual Dipawali<br />Fundraising Program
            </h1>

            {/* Diya divider */}
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px w-8 bg-[#f2c45a]/40" />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#f2c45a" className="shrink-0">
                <path d="M12 2C8.5 2 6 4.5 6 8c0 2.5 1.5 4.7 3.5 5.8L8 22h8l-1.5-8.2C16.5 12.7 18 10.5 18 8c0-3.5-2.5-6-6-6z" />
              </svg>
              <div className="h-px w-8 bg-[#f2c45a]/40" />
            </div>

            {/* Sub-heading */}
            <h2 className="m-0 mb-3 font-black text-white uppercase"
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '11px',
                letterSpacing: '0.22em',
              }}>
              For the Sacred Brick by Brick Project
            </h2>

            {/* Description */}
            <p className="m-0 text-gray-300 leading-relaxed"
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '12.5px',
                maxWidth: '460px',
              }}>
              Join us for an auspicious evening of divine Indian classical music,<br />
              spiritual community, and sacred service to help reconstruct Sri Hanuman Mandir.
            </p>
          </div>

          {/* RIGHT — Circular logo + BOOK NOW */}
          <div className="flex flex-col items-center gap-5 pt-2 z-30 mb-20 md:mb-0 scale-75 md:scale-100 transform origin-top md:origin-top-right">
            {/* Circular logo */}
            <div className="rounded-full overflow-hidden flex items-center justify-center bg-white"
              style={{
                width: '160px',
                height: '160px',
                border: '6px solid #2b1a6d',
                boxShadow: '0 0 48px rgba(0,0,0,0.6)',
              }}>
              <img
                src={logoImg}
                alt="Vedic Heritage"
                width={155}
                height={156}
                className="w-full h-full object-contain"
              />
            </div>

            {/* BOOK NOW pill */}
            <button
              type="button"
              onClick={bookTickets}
              className="bg-white border-none rounded-full flex items-center cursor-pointer transition-all duration-200 hover:-translate-y-0.5 group"
              style={{
                padding: '6px 6px 6px 22px',
                gap: '14px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}>
              <span className="font-black text-[#0b1660] tracking-widest whitespace-nowrap"
                style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px' }}>
                BOOK NOW
              </span>
              <span className="bg-[#0b1660] rounded-full flex items-center justify-center shrink-0"
                style={{ width: '36px', height: '36px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7M17 7H7M17 7v10" />
                </svg>
              </span>
            </button>
          </div>
        </div>

        {/* ── ARTISTS — pinned to bottom center ── */}
        <div className="absolute bottom-0 left-0 right-0 z-20 flex justify-center items-end pointer-events-none">
          <img
            src={artistsImg}
            alt="Performing Artists"
            width={1320}
            height={482}
            style={{
              width: '100%',
              maxWidth: '1020px',
              height: 'auto',
              maxHeight: '330px',
              objectFit: 'contain',
              objectPosition: 'bottom',
              filter: 'drop-shadow(0 -4px 24px rgba(0,0,0,0.5))',
              display: 'block',
            }}
          />
        </div>
      </section>
    </div>
  );
}

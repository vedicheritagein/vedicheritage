
import heroBg from '../assets/hero_background.webp';
import artistsImg from '../assets/image.png';
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
        <div className="relative z-10 h-full max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center md:items-start pt-10 px-[60px] gap-6 md:gap-0">
          {/* LEFT — Text block */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left w-full md:max-w-[52%]">
            {/* Main headline */}
            <h1 className="font-alga m-0 p-0 mb-5 font-extralight leading-[1.05] text-[#f2c45a]"
              style={{
                fontSize: 'clamp(38px, 5vw, 64px)',
              }}>
              Annual Dipawali<br />Fundraising Program
            </h1>

            <div className="flex items-center gap-4 mb-4 w-[340px] h-[25px]">
            <div className="h-px flex-1 bg-[#f2c45a]/80" />
            <svg width="15" height="23" viewBox="0 0 15 23" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.16667 1V6.86714C5.16667 7.30884 4.88334 7.69533 4.48646 7.89014C3.43932 8.40639 2.5577 9.20564 1.9415 10.1973C1.3253 11.189 0.999145 12.3334 1 13.501C1.00625 17.668 4.125 20.7933 6.20833 21.835M5.16667 4.12525H3.08333C2.5308 4.12525 2.00089 4.34476 1.61019 4.73549C1.21949 5.12623 1 5.65617 1 6.20875C1 6.76133 1.21949 7.29128 1.61019 7.68201C2.00089 8.07274 2.5308 8.29225 3.08333 8.29225H3.79167M9.33333 1V6.86714C9.33333 7.30884 9.61667 7.69533 10.0125 7.89014C11.0598 8.40624 11.9417 9.20543 12.5581 10.1971C13.1745 11.1888 13.5008 12.3333 13.5 13.501C13.5 17.668 10.375 20.7933 8.29167 21.835M9.33333 4.12525H11.4167C11.9692 4.12525 12.4991 4.34476 12.8898 4.73549C13.2805 5.12623 13.5 5.65617 13.5 6.20875C13.5 6.76133 13.2805 7.29128 12.8898 7.68201C12.4991 8.07274 11.9692 8.29225 11.4167 8.29225H10.7083M13.5 21.835H1M4.125 1H10.375" stroke="#E59F2D" stroke-width="2" stroke-linecap="round" />
            </svg>
            <div className="h-px flex-1 bg-[#f2c45a]/80" />
          </div>

            {/* Sub-heading */}
            <h2 className="m-0 mb-3 font-semibold text-white uppercase text-center leading-none"
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '18px',
                letterSpacing: '0.15em',
              }}>
              For the Sacred Brick by Brick Project
            </h2>

            {/* Description */}
            <p className="m-0 text-gray-300 leading-relaxed"
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '12.5px',
                maxWidth: '500px',
              }}>
             Join us for an auspicious evening of divine Indian classical music, spiritual community, and <br /> sacred service to help reconstruct Sri Hanuman Mandir.
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
              className="bg-white border-none flex items-center justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 group"
              style={{
                width: '180px',
                height: '50px',
                padding: '2px 2px 2px 23px',
                borderRadius: '63px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}>
              <span className="font-semibold text-[#0b1660] tracking-widest whitespace-nowrap leading-none"
                style={{ fontFamily: 'Outfit, sans-serif', fontSize: '16px' }}>
                BOOK NOW
              </span>
              <span className="bg-[#0b1660] rounded-full flex items-center justify-center shrink-0"
                style={{ width: '48px', height: '48px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
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

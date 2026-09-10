
import drumImg from '../assets/drum.webp';
import { SECTION } from '../config/site';
import { useBookTickets } from '../lib/booking';

export function CelebrateSection() {
  // Opens the ticket form directly, rather than scrolling to a section from
  // which the visitor still had to press another button.
  const bookTickets = useBookTickets();

  return (
    <section id={SECTION.aboutEvent} className="bg-white max-w-full overflow-hidden">
      <div className="max-w-[1180px] mx-auto pt-14 pb-12 px-6">
        {/* ── Header ── */}
        <div className="text-center mb-10">
          <p className="font-['Outfit',sans-serif] text-[14px] font-semibold text-gray-700 tracking-[0.02em] m-0 mb-1">
            Celebrate Diwali through
          </p>
          <h2 className="font-['Alga','Bodoni_Moda','Playfair_Display',Georgia,serif] text-[clamp(32px,4vw,48px)] font-normal text-[#e98314] m-0 leading-[1.15]">
            Music, Culture &amp; Community
          </h2>
        </div>

        {/* ── Three-column layout ── */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:flex-nowrap px-4">
          {/* LEFT — About the Event text */}
          <div className="flex-1 w-full lg:min-w-[260px] lg:max-w-[340px] text-center lg:text-left">
            <h3 className="font-['Alga','Bodoni_Moda','Playfair_Display',Georgia,serif] text-[20px] font-normal italic text-gray-700 m-0 mb-4">
              About the Event
            </h3>
            <p className="font-['Outfit',sans-serif] text-[11.5px] text-gray-500 leading-[1.8] m-0 mb-5">
              Join Vedic Heritage, Inc. for an inspiring evening of Indian classical music, cultural heritage, and community giving. The Annual Diwali Fundraiser brings together acclaimed artists for a memorable celebration while supporting the Brick by Brick Program and its community-focused initiatives.
            </p>
            <p className="font-['Outfit',sans-serif] text-[11.5px] text-gray-500 leading-[1.8] m-0">
              Enjoy soulful performances by Rahul Deshpande, Tejas &amp; Rajas Upadhye, Milind Kulkarni, and Amit Kavthekar, followed by dinner and an opportunity to celebrate the spirit of Diwali together.
            </p>
          </div>

          {/* CENTER — Drum image in circular container */}
          <div className="flex-none w-full max-w-[320px] aspect-square rounded-full bg-[#faedd9] flex items-center justify-center overflow-hidden mx-auto">
            <img
              src={drumImg}
              alt="Musical instruments"
              width={544}
              height={544}
              loading="lazy"
              decoding="async"
              className="w-[85%] h-[85%] object-contain"
            />
          </div>

          {/* RIGHT — Celebrate tradition + ticket */}
          <div className="flex-1 w-full lg:min-w-[280px] lg:max-w-[340px] flex flex-col gap-6 items-center lg:items-end">
            {/* Headlines */}
            <div className="text-center lg:text-right w-full">
              <p className="font-['Outfit',sans-serif] text-[15px] font-semibold text-gray-800 m-0 mb-1.5">
                Celebrate tradition.
              </p>
              <p className="font-['Outfit',sans-serif] text-[15px] font-semibold text-[#e98314] m-0 mb-1.5">
                Experience extraordinary music.
              </p>
              <p className="font-['Outfit',sans-serif] text-[15px] font-semibold text-gray-800 m-0">
                Support a meaningful cause.
              </p>
            </div>

            {/* Ticket box */}
            <div className="bg-[#fef3e2] border border-[#fde8cc] rounded-xl py-3 px-6 flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {/* Ticket icon */}
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e98314" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <path d="M8 6v12M16 6v12" strokeDasharray="2 2"/>
                </svg>
              </div>
              <div className="text-right">
                <div className="font-['Outfit',sans-serif] text-[11px] font-semibold text-gray-700 mb-0.5">
                  Ticket price
                </div>
                <div className="font-['Outfit',sans-serif] text-[26px] font-extrabold text-[#e98314] leading-none">
                  $100
                </div>
              </div>
            </div>

            {/* Book button */}
            <button
              type="button"
              onClick={bookTickets}
              className="bg-[#e98314] text-white border-none rounded-full py-2 px-2 pl-6 flex items-center justify-between w-full cursor-pointer font-['Outfit',sans-serif] text-[12px] font-extrabold tracking-[0.04em] shadow-[0_4px_16px_rgba(233,131,20,0.3)] transition-all duration-200 hover:bg-[#d07210] hover:-translate-y-[1px] group"
            >
              <span>BOOK YOUR TICKET NOW</span>
              <span className="bg-white rounded-full w-[36px] h-[36px] flex items-center justify-center shrink-0 ml-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e98314" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform duration-150">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

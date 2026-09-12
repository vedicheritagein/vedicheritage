
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
          <p className="font-['Outfit',sans-serif] text-[18px] font-bold text-black tracking-[0.02em] leading-none m-0 mb-1">
            Celebrate Diwali through
          </p>
          <h2 className="font-['Alga','Bodoni_Moda','Playfair_Display',Georgia,serif] text-[clamp(32px,4vw,48px)] font-normal text-[#e98314] m-0 leading-[1.15]">
            Music, Culture &amp; Community Development
          </h2>
        </div>

        {/* ── Three-column layout ── */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:flex-nowrap px-4">
          {/* LEFT — About the Event text */}
          <div className="flex-1 w-full lg:min-w-[260px] lg:max-w-[340px] text-center lg:text-left">
            <h3 className="font-['Alga','Bodoni_Moda','Playfair_Display',Georgia,serif] text-[20px] font-normal italic text-gray-800 m-0 mb-4">
              About the Event
            </h3>
            <p className="font-['Outfit',sans-serif] text-[11.5px] text-gray-500 leading-[1.8] m-0 mb-5">
              Join Vedic Heritage, Inc. for an inspiring evening of Indian classical music, cultural heritage, and community giving. The Annual Diwali Fundraiser brings together acclaimed artists for a memorable celebration while supporting the Brick by Brick Program and its community-focused initiatives.
            </p>
            <p className="font-['Outfit',sans-serif] text-[11.5px] text-gray-500 leading-[1.8] m-0 mb-5">
              VHI is conducting these programs for 4 decades at the Meotigious auditorium named after Sangeet Martandya Pandit Jasraj.
            </p>
            <p className="font-['Outfit',sans-serif] text-[11.5px] text-[#e98314] leading-[1.8] m-0">
              - Padma Vibhushan
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
          {/* RIGHT — Celebrate tradition + ticket */}
          <div className="flex-1 w-full lg:min-w-[280px] lg:max-w-[340px] flex flex-col gap-6 items-center">
            {/* Headlines */}
            <div className="text-center w-full">
              <p className="font-['Outfit',sans-serif] text-[18px] font-semibold text-gray-800 m-0 mb-1.5">
                Celebrate tradition.
              </p>
              <p className="font-['Outfit',sans-serif] text-[18px] font-semibold text-[#e98314] m-0 mb-1.5">
                Experience extraordinary music.
              </p>
              <p className="font-['Outfit',sans-serif] text-[18px] font-semibold text-gray-800 m-0">
                Support a meaningful cause.
              </p>
            </div>

            {/* Ticket box */}
            <div className="bg-[#fdeed6] rounded-[20px] py-4 px-6 flex items-center justify-center gap-6 w-full max-w-[280px]">
              {/* Ticket icon */}
              <svg width="40" height="32" viewBox="0 0 24 24" fill="none" stroke="#e98314" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M4 7v2c1.1 0 2 .9 2 2s-.9 2-2 2v2c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-2c-1.1 0-2-.9-2-2s.9-2 2-2V7c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2z"/>
                <path d="M16 8v8"/>
                <path d="M9 11h4"/>
                <path d="M9 13h4"/>
              </svg>

              {/* Vertical divider */}
              <div className="w-[1px] h-[36px] bg-[#f0cfa4]"></div>

              {/* Text */}
              <div className="flex flex-col text-left">
                <span className="font-['Outfit',sans-serif] text-[13px] font-bold text-gray-800 mb-0.5">
                  Ticket price
                </span>
                <span className="font-['Outfit',sans-serif] text-[24px] font-extrabold text-[#e98314] leading-none">
                  $100
                </span>
              </div>
            </div>

            {/* Book button */}
            <button
              type="button"
              onClick={bookTickets}
              className="bg-[#e98314] text-white border-none rounded-full py-2 pr-2 pl-4 flex items-center relative w-full max-w-[320px] h-[58px] cursor-pointer shadow-[0_4px_16px_rgba(233,131,20,0.3)] transition-all duration-200 hover:bg-[#d07210] hover:-translate-y-[1px] group"
            >
              <span className="font-['Outfit',sans-serif] text-[14px] font-bold tracking-[0.02em] w-full text-center pr-[48px]">
                BOOK YOUR TICKET NOW
              </span>
              <span className="bg-white rounded-full w-[44px] h-[44px] flex items-center justify-center shrink-0 absolute right-2 border-2 border-[#e98314]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e98314" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-150">
                  <path d="M7 17L17 7M17 7H7M17 7v10" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

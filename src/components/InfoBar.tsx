
export function InfoBar() {
  return (
    <div className="relative z-30 w-full" style={{ maxWidth: '1320px', margin: '-30px auto 0', padding: '0 20px' }}>
      {/* ── Figma Design Card Container ── */}
      <div
        className="bg-white flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 lg:gap-7 p-6 lg:py-9 lg:px-16"
        style={{
          width: '100%',
          maxWidth: '1320px',
          minHeight: '130px',
          opacity: 1,
          borderRadius: '80px 0px 30px 30px',
          borderLeft: '11px solid #e98314',
          borderRight: '11px solid #e98314',
          boxShadow: '0 12px 48px rgba(0, 0, 0, 0.16)',
          boxSizing: 'border-box',
        }}
      >
        {/* ── Date Block ── */}
        <div className="flex items-center gap-4 flex-1 min-w-[210px]">
          <div className="w-[52px] h-[52px] bg-white border border-gray-200 rounded-[16px] flex items-center justify-center shrink-0 shadow-sm">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#e98314">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-2 .9-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />
            </svg>
          </div>
          <div>
            <div className="text-[#e98314] font-extrabold uppercase tracking-[0.08em] mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', fontSize: '10px' }}>
              DATE
            </div>
            <div className="text-[#1a1a1a] font-bold leading-tight" style={{ fontFamily: 'Outfit, sans-serif', fontSize: '16px' }}>
              Saturday, Oct 24, 2026
            </div>
            <div className="text-[#777777] mt-0.5" style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px' }}>
              5:00 PM Sharp (Followed by Dinner)
            </div>
          </div>
        </div>

        {/* ── Location Block ── */}
        <div className="flex items-center gap-4 flex-1 min-w-[210px]">
          <div className="w-[52px] h-[52px] bg-white border border-gray-200 rounded-[16px] flex items-center justify-center shrink-0 shadow-sm">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#e98314">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
            </svg>
          </div>
          <div>
            <div className="text-[#e98314] font-extrabold uppercase tracking-[0.08em] mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', fontSize: '10px' }}>
              LOCATION
            </div>
            <div className="text-[#1a1a1a] font-bold leading-tight" style={{ fontFamily: 'Outfit, sans-serif', fontSize: '16px' }}>
              Pandit Jasraj Auditorium
            </div>
            <div className="text-[#777777] mt-0.5" style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px' }}>
              Vedic Heritage Inc., Hempstead NY
            </div>
          </div>
        </div>

        {/* ── Contact Block ── */}
        <div className="flex items-center gap-4 flex-1 min-w-[240px]">
          <div className="w-[52px] h-[52px] bg-white border border-gray-200 rounded-[16px] flex items-center justify-center shrink-0 shadow-sm">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#e98314">
              <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 1-.59 1-1.15v-3.48c0-.54-.45-.99-.99-.99z" />
            </svg>
          </div>
          <div>
            <div className="text-[#e98314] font-extrabold uppercase tracking-[0.08em] mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', fontSize: '9px' }}>
              CONTACT FOR SPONSORSHIP &amp; TICKETS
            </div>
            <div className="text-[#1a1a1a] font-bold leading-tight" style={{ fontFamily: 'Outfit, sans-serif', fontSize: '16px' }}>
              Manjula: 631-805-9105
            </div>
            <div className="text-[#777777] mt-0.5" style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px' }}>
              Deepa: 631-398-2890
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



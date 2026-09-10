
import { SECTION, SPONSORSHIP_SKUS } from '../config/site';
import { ENTRY_SPONSORSHIP_SKU } from '../lib/booking';
import { useCheckout } from '../lib/checkoutContext';
import { formatMoney } from '../lib/payments';

// `amount` is the design fallback shown before the price list loads. The server
// is the authority on price, so once the catalogue arrives the amount rendered
// comes from it - the page can never advertise a figure that differs from what
// is actually charged.
const tiers = [
  {
    id: 1,
    sku: SPONSORSHIP_SKUS.palladium,
    label: 'PALLADIUM SPONSOR',
    amount: '$20,000',
    color: '#e98314',
    perks: [
      'VIP Reserved Seating (10 Guests)',
      'VIP Dedicated Temple Plaque',
      'Special Stage Recognition',
      'Sacred Maha-Prasad Dinner Included',
    ],
  },
  {
    id: 2,
    sku: SPONSORSHIP_SKUS.platinum,
    label: 'PLATINUM SPONSOR',
    amount: '$15,000',
    color: '#e98314',
    perks: [
      'Premium Reserved Seating (8 Guests)',
      'Special Mandir Plaque Mention',
      'Exclusive Stage Blessing',
      'Sacred Maha-Prasad Dinner Included',
    ],
  },
  {
    id: 3,
    sku: SPONSORSHIP_SKUS.diamond,
    label: 'DIAMOND SPONSOR',
    amount: '$10,000',
    color: '#e98314',
    perks: [
      'Elite Reserved Seating (6 Guests)',
      'Plinth Brick Dedication',
      'Festival Program Spotlight',
      'Sacred Maha-Prasad Dinner Included',
    ],
  },
  {
    id: 4,
    sku: SPONSORSHIP_SKUS.gold,
    label: 'GOLD SPONSOR',
    amount: '$5,000',
    color: '#e98314',
    perks: [
      'Priority Reserved Seating (4 Guests)',
      'Mandir Wall Stone Engraving',
      'Program Mention',
      'Sacred Maha-Prasad Dinner Included',
    ],
  },
  {
    id: 5,
    sku: SPONSORSHIP_SKUS.silver,
    label: 'SILVER SPONSOR',
    amount: '$3,000',
    color: '#e98314',
    perks: [
      'Preferred Seating (2 Guests)',
      'Vedic Blessing Card',
      'Program Mention',
      'Sacred Maha-Prasad Dinner Included',
    ],
  },
  {
    id: 6,
    sku: SPONSORSHIP_SKUS.bronze,
    label: 'BRONZE SPONSOR',
    amount: '$1,000',
    color: '#e98314',
    perks: [
      'General Reserved (2 Guests)',
      'Vedic Blessing Card',
      'Sacred Maha-Prasad Dinner Included',
    ],
  },
];

// Alternating corner treatments. Odd cards (1, 3, 5) carry the wide sweep on the
// top-right; even cards (2, 4, 6) mirror it to the top-left. Both share the 32px
// bottom corners. Written as complete literal class strings so Tailwind's scanner
// picks them up.
const CORNERS_SWEEP_RIGHT =
  'rounded-tl-[6px] rounded-tr-[52px] rounded-br-[32px] rounded-bl-[32px]';
const CORNERS_SWEEP_LEFT =
  'rounded-tl-[52px] rounded-tr-[6px] rounded-br-[32px] rounded-bl-[32px]';

export function SponsorshipSection() {
  const { openCheckout, getProduct } = useCheckout();

  // Tier the form opens on. The cards are a price list, not six buttons, so the
  // one "Sponsor Now" has to start somewhere. Read from `lib/booking` rather
  // than derived from the card order here, so this button and the one in the
  // closing section cannot drift apart if the cards are ever reordered.
  const defaultSponsorshipSku = ENTRY_SPONSORSHIP_SKU;

  return (
    <section
      id={SECTION.sponsorship}
      className="bg-[#e5e5e5] pt-14 px-6 md:px-12 pb-12 rounded-[36px] max-w-[1450px] mx-auto -mt-[30px] relative z-20 overflow-hidden"
    >
      <div className="max-w-[1450px] mx-auto">
        {/* Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <h2 className="font-['Alga','Bodoni_Moda','Playfair_Display',Georgia,serif] text-[48px] font-medium text-gray-800 m-0 mb-3 leading-[100%] tracking-[0] text-center py-1">
            Sponsorship Tiers &amp; Tickets
          </h2>
          {/* Diya */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#e98314" className="mb-3">
            <path d="M12 2C8.5 2 6 4.5 6 8c0 2.5 1.5 4.7 3.5 5.8L8 22h8l-1.5-8.2C16.5 12.7 18 10.5 18 8c0-3.5-2.5-6-6-6z" />
          </svg>
          <p className="font-['Outfit',sans-serif] text-[12px] text-gray-600 max-w-[480px] mx-auto leading-[1.6]">
            All sponsorships include exclusive complimentary concert seats, prominent program visibility, and sacred blessings of Lord Hanuman.
          </p>
        </div>

        {/* Tier Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          {tiers.map((tier, index) => {
            const product = getProduct(tier.sku);
            // Server price wins over the design fallback once loaded.
            const amountLabel = product
              ? formatMoney(product.unitAmountCents)
              : tier.amount;
            return (
              <div
                key={tier.id}
                className={`bg-white overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex flex-col ${
                  index % 2 === 0 ? CORNERS_SWEEP_RIGHT : CORNERS_SWEEP_LEFT
                }`}
              >
                {/* No radii here on purpose: the card's overflow-hidden clips the header to
                    whichever corner variant that card uses, so the two cannot drift apart. */}
                <div className="bg-[#1e293b] py-2 px-10">
                  <div className="font-['Outfit',sans-serif] text-[9.5px] font-bold tracking-[0.05em] uppercase text-white">
                    {tier.label}
                  </div>
                </div>

                <div className="px-10 pb-8 pt-6 flex flex-col grow">
                  {/* Amount */}
                  <div
                    className="font-['Outfit',sans-serif] text-[28px] font-extrabold mb-6"
                    style={{ color: tier.color }}
                  >
                    {amountLabel}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gray-100 mb-5" />

                  {/* Perks */}
                  <ul className="m-0 p-0 list-none flex flex-col gap-3 grow">
                    {tier.perks.map((perk, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 font-['Outfit',sans-serif] text-[9.5px] font-semibold text-gray-600 leading-[1.4]"
                      >
                        <span className="text-[12px] leading-none shrink-0 text-[#e98314] mt-px">
                          ✓
                        </span>
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* The single call to action for the whole section. The cards above
            describe what each tier includes; the tier itself is chosen in the
            form this opens. If the price list is unreachable the provider shows
            the phone/email dialog, so this is never a dead button. */}
        <div className="text-center mb-8 mt-4">
          <button
            type="button"
            onClick={() => openCheckout(defaultSponsorshipSku)}
            className="bg-[#e98314] text-white border-none rounded-full py-3.5 px-10 inline-flex items-center justify-center cursor-pointer font-['Outfit',sans-serif] text-[13px] font-bold tracking-[0.05em] shadow-[0_4px_16px_rgba(233,131,20,0.3)] transition-all hover:bg-[#d07210] hover:-translate-y-[1px]"
          >
            SPONSOR NOW
          </button>
        </div>

        {/* Divider with text */}
        <div className="relative flex items-center justify-center mb-12">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#e98314]/30" />
          </div>
          <div className="relative bg-[#e5e5e5] px-4 font-['Outfit',sans-serif] text-[12px] font-bold text-[#e98314]">
            Contact for Sponsorship &amp; Tickets
          </div>
        </div>

        {/* Footer info blocks inline in Sponsorship section according to design */}
        <div className="flex flex-wrap justify-center gap-6 pb-8">
          {/* Manjula */}
          <div className="bg-white rounded-xl py-3 px-5 flex items-center gap-4 shadow-sm flex-1 min-w-[240px] max-w-[320px]">
            <div className="bg-[#fff8f0] text-[#e98314] w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-[#fde8cc]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 1-.59 1-1.15v-3.48c0-.54-.45-.99-.99-.99z" />
              </svg>
            </div>
            <div>
              <div className="font-['Outfit',sans-serif] text-[9.5px] font-semibold text-gray-500 mb-0.5">
                Manjula
              </div>
              <div className="font-['Outfit',sans-serif] text-[13px] font-bold text-gray-800">
                631-805-9105 / 516-260-8915
              </div>
            </div>
          </div>

          {/* Deepa */}
          <div className="bg-white rounded-xl py-3 px-5 flex items-center gap-4 shadow-sm flex-1 min-w-[240px] max-w-[320px]">
            <div className="bg-[#fff8f0] text-[#e98314] w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-[#fde8cc]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 1-.59 1-1.15v-3.48c0-.54-.45-.99-.99-.99z" />
              </svg>
            </div>
            <div>
              <div className="font-['Outfit',sans-serif] text-[9.5px] font-semibold text-gray-500 mb-0.5">
                Deepa
              </div>
              <div className="font-['Outfit',sans-serif] text-[13px] font-bold text-gray-800">
                631-398-2890
              </div>
            </div>
          </div>

          {/* Mail */}
          <div className="bg-white rounded-xl py-3 px-5 flex items-center gap-4 shadow-sm flex-1 min-w-[240px] max-w-[320px]">
            <div className="bg-[#fff8f0] text-[#e98314] w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-[#fde8cc]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
            </div>
            <div>
              <div className="font-['Outfit',sans-serif] text-[9.5px] font-semibold text-gray-500 mb-0.5">
                Mail
              </div>
              <div className="font-['Outfit',sans-serif] text-[13px] font-bold text-gray-800">
                vedic.heritageinc@gmail.com
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orange accent bar at bottom of the section */}
      <div className="h-2 bg-[#e98314] -mx-8 -mb-12 mt-4" />
    </section>
  );
}
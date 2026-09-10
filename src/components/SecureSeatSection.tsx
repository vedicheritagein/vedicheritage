import React from 'react';
import hanumanImg from '../assets/hanuman-mandir.webp';
import { SECTION, TICKET_SKU } from '../config/site';
import { useBookTickets, useSponsorNow } from '../lib/booking';
import { useCheckout } from '../lib/checkoutContext';
import { formatMoney } from '../lib/payments';

export interface SecureSeatSectionProps {
  /** Overrides the default booking destination from `config/site`. */
  onPurchaseTicket?: () => void;
  /** Overrides the default sponsorship destination. */
  onSponsorNow?: () => void;
}

export const SecureSeatSection: React.FC<SecureSeatSectionProps> = ({
  onPurchaseTicket,
  onSponsorNow,
}) => {
  const { getProduct } = useCheckout();
  const bookTickets = useBookTickets();
  const sponsorNow = useSponsorNow();

  // Price comes from the server when available so the button can never advertise
  // an amount different from the one that gets charged.
  const ticket = getProduct(TICKET_SKU);
  const priceLabel = ticket ? formatMoney(ticket.unitAmountCents) : '$100';

  // Shared with every other booking button on the page, so all of them lead
  // to the same place: an external ticketing page when one is configured,
  // otherwise the checkout form - and the provider falls back to the
  // phone/email dialog if that form cannot open.
  const purchaseTicket = onPurchaseTicket ?? bookTickets;

  // Opens the sponsorship form, exactly as the "Sponsor Now" button in the
  // sponsorship section does. It used to navigate to a `mailto:` link, which
  // on a machine with no mail client configured does nothing whatsoever - so
  // the button looked broken to precisely the visitor worth the most to the
  // fundraiser. Anyone who would rather talk first still has the phone and
  // email in the footer, and in the dialog shown if the form cannot open.
  const sponsor = onSponsorNow ?? sponsorNow;

  return (
    <section
      id={SECTION.tickets}
      className="w-full bg-[#FFFFFF] py-4 sm:py-6 md:py-8 px-2 sm:px-4 md:px-6"
    >
      <div className="w-full max-w-[1440px] mx-auto">
        {/* Banner with Hanuman Mandir background, single uniform color overlay #4A0D12C9 and golden border */}
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border-2 border-[#D1B280]">
          
          {/* Background Image: Hanuman Mandir */}
          <div className="absolute inset-0 z-0">
            <img
              src={hanumanImg}
              alt="Sri Hanuman Mandir Sanctum Sanctorum"
              width={1465}
              height={1465}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover object-center scale-102"
            />
          </div>

          {/* Single uniform color overlay: #4A0D12C9 */}
          <div 
            className="absolute inset-0 z-10"
            style={{
              backgroundColor: '#4A0D12C9',
            }}
          />

          {/* Content container */}
          <div className="relative z-20 px-6 py-8 sm:px-12 sm:py-12 md:py-16 text-center max-w-3xl mx-auto">
            
            {/* Golden Header in #FFD238 with Alga serif font */}
            <h2 className="font-['Alga','Bodoni_Moda','Playfair_Display',Georgia,serif] text-lg sm:text-xl md:text-2xl lg:text-[30px] font-normal text-[#FFD238] tracking-wide leading-tight drop-shadow-sm">
              Secure Your Blessed Seat Today
            </h2>

            {/* Subtext */}
            <p className="font-['Outfit',sans-serif] mt-4 sm:mt-5 text-[10px] sm:text-xs text-[#FFF5ED] leading-relaxed font-normal max-w-2xl mx-auto">
              Due to auditorium capacity constraints, seating is strictly limited. Avoid
              disappointment and book your tickets or secure a sponsorship early to support the
              building project.
            </p>

            {/* Action Buttons */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5">
              
              {/* Purchase Ticket Button in #FFFFFF and #4A0D12 */}
              <button
                type="button"
                onClick={purchaseTicket}
                className="w-full sm:w-auto bg-[#FFFFFF] hover:bg-[#FFECD6] text-[#4A0D12] hover:text-[#38090D] font-bold text-xs sm:text-sm tracking-wider uppercase px-5 py-2.5 rounded-md shadow-lg hover:shadow-xl transition-all duration-200 transform active:scale-98 cursor-pointer"
              >
                PURCHASE TICKET ({priceLabel})
              </button>

              {/* Sponsor Now Button */}
              <button
                type="button"
                onClick={sponsor}
                className="w-full sm:w-auto bg-transparent hover:bg-white/10 text-[#FFFFFF] font-semibold text-xs sm:text-sm tracking-wider uppercase px-5 py-2.5 rounded-md border border-[#FFFFFF] hover:border-[#FFD238] transition-all duration-200 cursor-pointer backdrop-blur-[2px]"
              >
                SPONSOR NOW
              </button>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecureSeatSection;

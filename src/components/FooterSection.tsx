import React from 'react';
import { ChevronUp } from 'lucide-react';
import { CONTACT, MAP_URL, SECTION, VOLUNTEER_MAILTO, orgUrl } from '../config/site';
import { scrollToSection, scrollToTop } from '../lib/navigation';

interface FooterLink {
  label: string;
  /** In-page section id, an absolute URL, or a mailto:/tel: URI. */
  href: string;
}

/**
 * Footer navigation.
 *
 * This footer was copied from the main site, so every label describes a page
 * that exists over there - but the hrefs had been left as in-page anchors
 * derived from the labels (`#for-shiv-abhishek`, `#privacy-policy`, ...), none
 * of which exist on this single page. So they now point at the real pages on
 * the main site, which the renderer opens in a new tab (it adds
 * target/rel to any `http` href), keeping the buyer's checkout tab intact.
 *
 * The two exceptions are deliberate: `Sponsorship` stays an in-page anchor
 * because it means THIS fundraiser's tiers, not the main site's donations page,
 * and `Volunteering` stays a mailto because there is no page to send it to.
 */
const FOOTER_COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'More Info',
    links: [
      { label: 'Daily Program', href: orgUrl('daily-program/') },
      { label: 'Events', href: orgUrl('events/') },
      { label: 'Gallery', href: orgUrl('gallery/') },
      { label: 'Donations', href: orgUrl('donations/') },
      { label: 'Contact', href: orgUrl('contact/') },
    ],
  },
  {
    title: 'Poojas & Services',
    links: [
      { label: 'For Shantipath with Prasad', href: orgUrl('product/for-shantipath-with-prasad/') },
      { label: 'For Chowki with Prasad', href: orgUrl('product/for-chowki-with-prasad/') },
      { label: 'For Car puja', href: orgUrl('product/for-car-puja/') },
      { label: 'For Shiv Abhishek', href: orgUrl('product/for-shiv-abhishek/') },
    ],
  },
  {
    // These are individual dated instances on the main site, so the slugs carry
    // a counter (`pradosh-vrat-20`) and will eventually point at a past date.
    // The Events page above is the durable link if they need replacing.
    title: 'Our Events',
    links: [
      { label: 'Varuthini Ekadashi', href: orgUrl('events/varuthini-ekadashi/') },
      { label: 'Pradosh Vrat', href: orgUrl('events/pradosh-vrat-20/') },
      { label: 'Amavasya', href: orgUrl('events/amavasya-9/') },
      { label: 'Akshaya Tritiya', href: orgUrl('events/akshaya-tritiya/') },
    ],
  },
  {
    title: 'Quick Links',
    links: [
      { label: 'History Of temple', href: orgUrl('history/') },
      { label: 'Map', href: MAP_URL },
      // The main site publishes both, which a site taking donations is expected
      // to have - so these use its pages rather than needing their own here.
      { label: 'Privacy Policy', href: orgUrl('privacy-policy/') },
      { label: 'Terms Of Use', href: orgUrl('terms-of-use/') },
    ],
  },
  {
    title: 'Sponsorship',
    links: [
      { label: 'Sponsorship', href: `#${SECTION.sponsorship}` },
      { label: 'Volunteering', href: VOLUNTEER_MAILTO },
    ],
  },
];

const isInPageLink = (href: string) => href.startsWith('#');

export const FooterSection: React.FC = () => {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!isInPageLink(href)) return; // let the browser handle mailto: and external URLs
    event.preventDefault();
    scrollToSection(href.slice(1));
  };

  return (
    <footer id={SECTION.contact} className="w-full">
      {/* Upper Band: Solid Black #000000 with 5 Navigation Columns and Diya Art on the RIGHT SIDE */}
      <div className="relative bg-[#000000] pt-14 pb-20 px-3 sm:px-5 md:px-6 overflow-hidden">

        <div className="w-full max-w-[1440px] mx-auto relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12">

            {FOOTER_COLUMNS.map(({ title, links }) => (
              <div key={title}>
                <h4 className="font-['Alga','Bodoni_Moda','Playfair_Display',Georgia,serif] text-[#C57700] text-lg sm:text-xl font-normal mb-5 tracking-wide">
                  {title}
                </h4>
                <ul className="space-y-3 text-xs sm:text-sm text-[#FFFFFF] font-['Outfit',sans-serif]">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      <a
                        href={href}
                        onClick={(e) => handleClick(e, href)}
                        {...(href.startsWith('http')
                          ? { target: '_blank', rel: 'noreferrer' }
                          : {})}
                        className="hover:text-[#FFD238] transition-colors"
                      >
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

          </div>
        </div>

        {/* Decorative Diya Line Art positioned on the RIGHT SIDE under Sponsorship */}
        <div className="absolute right-6 sm:right-16 -bottom-6 pointer-events-none opacity-45 hover:opacity-75 transition-opacity">
          <svg
            width="220"
            height="170"
            viewBox="0 0 220 170"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-[#F07B00]"
            aria-hidden="true"
          >
            {/* Diya Flame */}
            <path
              d="M110 15 C100 45, 88 65, 88 85 C88 102, 98 112, 110 112 C122 112, 132 102, 132 85 C132 65, 120 45, 110 15 Z"
              strokeWidth="2"
              fill="none"
            />
            {/* Inner Flame */}
            <path
              d="M110 40 C105 58, 98 70, 98 84 C98 94, 103 100, 110 100 C117 100, 122 94, 122 84 C122 70, 115 58, 110 40 Z"
              strokeWidth="1.5"
              fill="none"
            />
            {/* Diya Base / Lamp */}
            <path
              d="M30 115 C45 155, 175 155, 190 115 C170 120, 50 120, 30 115 Z"
              strokeWidth="2.5"
              fill="none"
            />
            {/* Ornaments on Lamp */}
            <path
              d="M45 125 C65 145, 155 145, 175 125"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <circle cx="110" cy="138" r="4" strokeWidth="1.5" />
            <circle cx="85" cy="133" r="3.5" strokeWidth="1.5" />
            <circle cx="135" cy="133" r="3.5" strokeWidth="1.5" />
            <circle cx="62" cy="126" r="3" strokeWidth="1.5" />
            <circle cx="158" cy="126" r="3" strokeWidth="1.5" />
          </svg>
        </div>
      </div>

      {/* Lower Band: Rich Red Maroon #6E161C / #73161E */}
      <div className="bg-[#73161E] py-10 px-3 sm:px-5 md:px-6 border-t border-[#8A1D27]/50">
        <div className="w-full max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">

          {/* Address */}
          <div>
            <h4 className="font-['Alga','Bodoni_Moda','Playfair_Display',Georgia,serif] text-[#FFFFFF] text-xl font-normal mb-4 tracking-wide">
              Address
            </h4>
            <div className="text-xs sm:text-sm text-[#FFFFFF]/90 space-y-1 font-['Outfit',sans-serif] leading-relaxed">
              <p className="font-medium text-[#FFFFFF]">Vedic Heritage Inc</p>
              <p>111 Jerusalem Ave</p>
              <p>Hempstead NY 11550,</p>
              <p>USA</p>
            </div>
          </div>

          {/* Connect With Us */}
          <div>
            <h4 className="font-['Alga','Bodoni_Moda','Playfair_Display',Georgia,serif] text-[#FFFFFF] text-xl font-normal mb-4 tracking-wide">
              Connect With Us
            </h4>
            <div className="text-xs sm:text-sm text-[#FFFFFF]/90 space-y-1.5 font-['Outfit',sans-serif]">
              <p>
                <span className="text-[#FFFFFF]">Temple :</span>{' '}
                <a href="tel:+15162608915" className="hover:text-[#FFD238] transition-colors">
                  +1 516-260-8915
                </a>
              </p>
              <p>
                <span className="text-[#FFFFFF]">Temple :</span>{' '}
                <a href="tel:+15165399055" className="hover:text-[#FFD238] transition-colors">
                  +1 516-539-9055
                </a>
              </p>
              <p>
                <span className="text-[#FFFFFF]">Managing Director (Ms. Khosla) :</span>{' '}
                <a href="tel:+16318059105" className="hover:text-[#FFD238] transition-colors">
                  +1 631-805-9105
                </a>
              </p>
              <p>
                <span className="text-[#FFFFFF]">Email :</span>{' '}
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="hover:text-[#FFD238] transition-colors"
                >
                  {CONTACT.email}
                </a>
              </p>
            </div>
          </div>

          {/* Follow Us - Exact Orange Facebook and Instagram Icons */}
          <div>
            <h4 className="font-['Alga','Bodoni_Moda','Playfair_Display',Georgia,serif] text-[#FFFFFF] text-xl font-normal mb-4 tracking-wide">
              Follow Us
            </h4>
            <div className="flex items-center gap-3.5">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="hover:scale-115 transition-transform duration-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#F07B00" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="hover:scale-115 transition-transform duration-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#F07B00" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Attribution & Scroll to Top */}
          <div className="flex flex-col md:items-end justify-between h-full space-y-4">
            <div className="text-xs text-[#FFFFFF]/85 md:text-right space-y-1">
              <p>Vedic Heritage Hanuman Mandir. All Rights Reserved.</p>
              <p>
                Powered by{' '}
                <span className="text-[#FFFFFF] font-medium hover:text-[#FFD238] transition-colors cursor-pointer">
                  Mind Spark Technologies
                </span>
              </p>
            </div>

            {/* Back to top chevron button */}
            <button
              type="button"
              onClick={scrollToTop}
              aria-label="Scroll back to top"
              className="self-start md:self-end w-9 h-9 rounded bg-black/40 hover:bg-[#F07B00] text-[#FFFFFF] flex items-center justify-center transition-colors duration-200 cursor-pointer border border-white/15"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default FooterSection;

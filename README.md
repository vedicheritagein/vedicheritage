# Annual Dipawali Fundraising Program — Vedic Heritage Inc.

Single-page site for the Annual Dipawali Fundraising Program (Saturday 24 October
2026, Pandit Jasraj Auditorium, Hempstead NY), raising funds for the Sri Hanuman
Mandir *Brick by Brick* project.

React 19 + TypeScript + Vite 8, styled with Tailwind CSS v4.

## Getting started

```bash
npm install
npm run dev        # dev server with HMR
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck, then production build into `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript only, no build |
| `npm run optimize:images` | Re-run the image pipeline (see below) |
| `npm run favicons` | Regenerate the favicons from the logo (see below) |

## Before launch

Two things in this repo are placeholders and **must** be changed:

1. **`index.html` — replace `https://example.com`.** It appears in the canonical
   link, the Open Graph / Twitter tags and the JSON-LD. Social previews on
   Facebook, WhatsApp and X need absolute URLs on the real domain or they will
   not render at all.
2. **`src/config/site.ts` — set `BOOKING.ticketUrl`.** While it is `null`, every
   "book" button scrolls to the tickets section and the final purchase button
   opens a pre-filled email. Point it at the real checkout link (Eventbrite,
   Zelle, PayPal, …) and every booking button follows automatically.

Also outstanding:

- **Privacy Policy** and **Terms Of Use** in the footer have no page yet and
  currently scroll to the contact block. A site accepting donations is expected
  to publish both.
- The Facebook and Instagram links point at the bare `facebook.com` /
  `instagram.com` domains rather than the temple's own pages.
- `BOOKING.websiteUrl` is unset, so "Explore Vedic Heritage" scrolls to the
  footer. Set it to send visitors to the main temple site instead.

## How things are wired

**Navigation.** `src/config/site.ts` holds the section ids, contact routes and
CTA destinations; `src/lib/navigation.ts` has the scroll helpers and the
`useActiveSection` hook that highlights the current navbar link. Every anchor id
comes from the `SECTION` object, so a link and its target cannot drift apart.
Sections carry those ids in `App.tsx` and in the individual section components.

**Content.** Event copy currently lives inline in each section component. Phone
numbers, the email and the venue are repeated across `InfoBar`,
`SponsorshipSection` and `FooterSection`, so a change to any of them means
editing more than one file — worth consolidating into a content module next.

## Analytics

Two sinks, each switched on only by its own variable, each a no-op when that
variable is empty:

| Variable | Sink | Module |
| --- | --- | --- |
| `VITE_META_PIXEL_ID` | Meta browser pixel | `src/lib/pixel.ts` |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics 4 | `src/lib/analytics.ts` |

Components never call a sink directly. They call `src/lib/track.ts`, which fans
out to whichever are enabled and translates Meta's event vocabulary into GA4's,
so a component reports a conversion once and does not need an opinion about two
schemas.

Both are empty by default, including in `.env`, so a dev server, the test suite
and any preview build report nothing. That is deliberate: testing the payment
flow must not be able to push fake ticket sales into the live ad account or the
live GA property. Turning tracking on is a deployment decision - set the two
variables in the hosting environment, not in a committed file.

Note this project is Vite, not Next.js - only `VITE_*` names reach the browser.
A `NEXT_PUBLIC_*` variable is silently ignored.

Server-side conversion reporting (Meta's Conversions API) is deliberately not
wired up. It needs a backend relay holding the CAPI access token, since the
token cannot ship in browser JavaScript. `trackEvent` already accepts an event
ID and passes it to the pixel as `eventID`, which is the hook a relay would
match against so a browser report and a server report of the same order count
as one conversion rather than two.

### Testing analytics

Fill in the two variables in `.env`, restart `npm run dev`, and go through a
real booking. Use the debug tools below rather than the live reports, so a test
purchase lands in a debug view instead of your campaign numbers.

**Is anything installed at all.** In the browser console on `localhost:5173`:

```js
typeof window.fbq       // 'function' once the pixel is on
typeof window.gtag      // 'function' once GA4 is on
```

If either is `undefined`, the variable is empty or the dev server was not
restarted - Vite reads `.env` at startup only. If both are defined but nothing
arrives, check whether an ad blocker is eating `fbevents.js` and `gtag/js`; test
in a clean browser profile.

**Meta pixel.** Install the *Meta Pixel Helper* Chrome extension and open the
site - it lists every event as it fires. For the full picture use Events Manager
> your dataset > **Test Events**, enter `http://localhost:5173`, and watch
events arrive live. Expected sequence:

| Action | Meta event | GA4 event |
| --- | --- | --- |
| Page load | `PageView` | `page_view` |
| Any "Book now" / "Sponsor now" click | `InitiateCheckout` | `begin_checkout` |
| Returning from a successful payment | `Purchase` | `purchase` |
| "Add to calendar" after paying | `AddToCalendar` | `add_to_calendar` |
| The phone/email fallback dialog opening | `Contact` | `generate_lead` |

**GA4.** Open Admin > **DebugView** in the GA4 property. It only shows traffic
flagged as debug, so install the *Google Analytics Debugger* extension first.
Meta's names are translated, so look for the right-hand column above. Realtime
reports work too but lag by up to a minute.

**Unit tests.** `npm test` covers both modules with the variables stubbed,
including that nothing fires when they are empty and that a purchase is reported
once however many times the payment return dialog polls:

```bash
npx vitest run src/lib/pixel.test.ts src/lib/analytics.test.ts src/lib/track.test.ts
```

**Before going back to normal work,** empty both variables in `.env` again.
Leaving a live pixel ID in a dev environment is how test bookings end up in the
campaign's cost-per-purchase.

## Images

`src/assets` originally held 67 MB of PNGs exported at full design resolution -
some 2560px wide for a 288px box. `scripts/optimize-images.mjs` converts them to
WebP sized for the layout they actually appear in, bringing the built site to
about 2.3 MB.

The script follows three rules so the rendered result stays visually identical:
it never upscales, never crops or changes an aspect ratio, and never flattens
alpha. Sizes come from a table of measured CSS boxes at the top of the file,
targeting 2x for HiDPI screens.

It reads `.png`/`.jpg` and writes `.webp`, deleting the source. So to add or
replace an image:

```bash
# 1. drop the new PNG/JPG into src/assets (or src/assets/slide for a carousel slide)
# 2. add its measured CSS box to the LAYOUT table in scripts/optimize-images.mjs
#    (slide/* files are covered by the shared __slide__ entry)
npm run optimize:images -- --dry-run   # preview
npm run optimize:images                # convert
# 3. update the import to the .webp extension
```

Carousel slides in `src/assets/slide/` are picked up automatically by
`import.meta.glob` and sorted by filename — no code change needed to add one.

## Favicons

`scripts/generate-favicons.mjs` (`npm run favicons`) builds the icon set in
`public/` from `src/assets/logo.webp`:

| File | Used for |
| --- | --- |
| `favicon-16.png`, `favicon-32.png` | browser tabs, transparent |
| `apple-touch-icon.png` (180px) | iOS home screen, opaque white |

Output is PNG rather than WebP because Safari does not reliably render WebP
favicons. The iOS icon is flattened onto white since iOS composites
transparency onto black.

The logo is a detailed circular seal, so at 16-32px the rim lettering is not
legible and it reads as a dark navy emblem. If a crisper tab icon matters, crop
a zoomed variant of just the central motif and point the two `favicon-*` entries
at it, leaving the full seal for `apple-touch-icon`.

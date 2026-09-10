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

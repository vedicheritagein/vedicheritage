/**
 * Image pipeline for src/assets.
 *
 * The source PNGs came straight out of the design tool at export resolution:
 * 67 MB in total, some of them 2560px wide for a 288px box. This script converts
 * them to WebP sized for the layout they actually appear in.
 *
 * Three rules keep the rendered result visually identical to the PNG originals:
 *
 *   1. Never upscale. If a source is already smaller than its target, the pixel
 *      dimensions are left alone and only the encoding changes.
 *   2. Never crop, and never change the aspect ratio - only a width is passed to
 *      sharp, so height always follows. The `object-fit` / `object-position` rules
 *      in the components therefore carry on cropping exactly as they do today, at
 *      every viewport rather than only the one that was measured.
 *   3. Never flatten alpha. The cutouts (logo, artist portraits, drum, the artist
 *      group shot) rely on transparency.
 *
 * `box` below is the largest CSS box each image occupies, measured in a browser at
 * a 1920px viewport. Targets are 2x that for HiDPI screens. `fit: 'cover'` scales
 * so the image still covers the whole box; `fit: 'contain'` fits it inside.
 *
 * Two entries override `dpr` and `quality`. Both are background photographs sitting
 * behind a ~79% opaque colour overlay, which erases fine detail before a visitor
 * ever sees it - spending HiDPI resolution and a high quality factor on them buys
 * nothing. hanuman-mandir was 966 kB, 35% of the whole page, on its own.
 *
 * Run with --dry-run to preview without writing anything.
 */
import sharp from 'sharp';
import { readdirSync, statSync, unlinkSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ASSETS = 'src/assets';
const DPR = 2;
const QUALITY = 82;
const DRY = process.argv.includes('--dry-run');

/** Largest CSS box per image, measured at a 1920px viewport. */
const LAYOUT = {
  'logo.png': { box: [148, 148], fit: 'contain' },
  'hero_background.png': { box: [1905, 580], fit: 'cover', quality: 72 },
  'image 3.png': { box: [1020, 330], fit: 'contain' },
  'drum.png': { box: [272, 272], fit: 'contain' },
  'shri rahul.png': { box: [238, 238], fit: 'cover' },
  'shri tejas.png': { box: [238, 238], fit: 'cover' },
  'shri millnd.png': { box: [238, 238], fit: 'cover' },
  'shri amit.png': { box: [238, 238], fit: 'cover' },
  'sacred-havan.png': { box: [455, 254], fit: 'cover' },
  'prasad-feast.png': { box: [455, 254], fit: 'cover' },
  'sacred-aarti.png': { box: [455, 254], fit: 'cover' },
  'hanuman-mandir.png': { box: [1465, 304], fit: 'cover', dpr: 1, quality: 70 },
  // Every file in slide/ renders in the same fixed 288px carousel frame.
  __slide__: { box: [288, 288], fit: 'cover' },
};

/** Referenced nowhere in src/. Confirmed by grep plus an import.meta.glob review. */
const UNUSED = [
  'artists/rahul-deshpande.png',
  'artists/tabla-player.png',
  'artists/tejas-rajas-upadhye.png',
  'hero.png',
  'react.svg',
  'vite.svg',
  // Byte-identical duplicate of hanuman-mandir.png (same md5), so the carousel was
  // showing the same photo as the banner directly below it.
  'slide/55f0899b2880f40e372c9ca9dfae6bb6937729e3.png',
];

const toPosix = (p) => p.split(sep).join('/');

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });

/**
 * Scale factor that makes the source cover (or fit inside) `box` at `DPR`,
 * clamped to 1 so we never upscale.
 */
function scaleFor(width, height, { box: [bw, bh], fit, dpr = DPR }) {
  const [tw, th] = [bw * dpr, bh * dpr];
  const ratio =
    fit === 'cover'
      ? Math.max(tw / width, th / height)
      : Math.min(tw / width, th / height);
  return Math.min(1, ratio);
}

let before = 0;
let after = 0;
const rows = [];

for (const path of walk(ASSETS)) {
  const rel = toPosix(relative(ASSETS, path));

  if (UNUSED.includes(rel)) {
    before += statSync(path).size;
    rows.push([rel, 'deleted (unused)', '']);
    if (!DRY) unlinkSync(path);
    continue;
  }

  if (!/\.(png|jpe?g)$/i.test(path)) continue;

  const layout = LAYOUT[rel.startsWith('slide/') ? '__slide__' : rel];
  if (!layout) {
    console.warn(`  ! no layout entry for ${rel} - skipped`);
    continue;
  }

  const srcBytes = statSync(path).size;
  const meta = await sharp(path).metadata();
  const scale = scaleFor(meta.width, meta.height, layout);

  // Width only: sharp derives the height, so the aspect ratio cannot drift.
  const width = Math.round(meta.width * scale);

  let pipeline = sharp(path);
  if (scale < 1) pipeline = pipeline.resize({ width });
  pipeline = pipeline.webp({
    quality: layout.quality ?? QUALITY,
    effort: 6,
    alphaQuality: 100,
  });

  const out = path.replace(/\.(png|jpe?g)$/i, '.webp');
  const info = DRY
    ? await pipeline.toBuffer({ resolveWithObject: true }).then((r) => r.info)
    : await pipeline.toFile(out);

  if (!DRY) unlinkSync(path);

  before += srcBytes;
  after += info.size;
  rows.push([
    rel,
    `${meta.width}x${meta.height} -> ${info.width}x${info.height}`,
    `${(srcBytes / 1048576).toFixed(2)}MB -> ${(info.size / 1048576).toFixed(2)}MB`,
  ]);
}

const pad = Math.max(...rows.map((r) => r[0].length));
for (const [name, dims, size] of rows) {
  console.log(`  ${name.padEnd(pad)}  ${dims.padEnd(26)}  ${size}`);
}
console.log(
  `\n  ${DRY ? '[dry run] ' : ''}total ${(before / 1048576).toFixed(1)}MB -> ` +
    `${(after / 1048576).toFixed(1)}MB  ` +
    `(${(100 - (after / before) * 100).toFixed(1)}% smaller)`
);

/**
 * Generates the favicon set in public/ from the Vedic Heritage logo.
 *
 * Output is PNG rather than WebP on purpose: Safari does not reliably render
 * WebP favicons, and a tab icon that silently fails on every iPhone and Mac is
 * not worth the couple of kilobytes saved. The source is still logo.webp.
 *
 * The logo is 155x156 - very nearly square but not quite - so it is scaled with
 * `fit: 'contain'`, which pads to an exact square rather than cropping the seal
 * or stretching it by half a percent.
 *
 * Run: npm run favicons
 */
import sharp from 'sharp';
import { statSync } from 'node:fs';

const SOURCE = 'src/assets/logo.webp';

/** Scales the logo to fit a square of `size`, keeping its aspect ratio. */
const scaledLogo = (size) =>
  sharp(SOURCE)
    .resize({
      width: size,
      height: size,
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();

/**
 * Browser tab icons, transparent so the seal sits on the tab's own colour in
 * both light and dark browser themes.
 */
async function tabIcon(file, size) {
  await sharp(await scaledLogo(size))
    .png({ compressionLevel: 9 })
    .toFile(file);
}

/**
 * iOS home screen icon. iOS composites transparency onto black, which would ring
 * the seal in dark, so this one is built on an opaque white canvas - the colour
 * the logo is designed against - with a little breathing room around it.
 *
 * The canvas is created with `channels: 3`, so the result has no alpha channel
 * at all. Relying on `.flatten()` here would not be safe: sharp applies its
 * operations in a fixed internal order rather than call order.
 */
async function appleTouchIcon(file, size, padding = 0.08) {
  const inner = Math.round(size * (1 - padding * 2));
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([{ input: await scaledLogo(inner), gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toFile(file);
}

await tabIcon('public/favicon-16.png', 16);
await tabIcon('public/favicon-32.png', 32);
await appleTouchIcon('public/apple-touch-icon.png', 180);

for (const file of [
  'public/favicon-16.png',
  'public/favicon-32.png',
  'public/apple-touch-icon.png',
]) {
  const meta = await sharp(file).metadata();
  console.log(
    `  ${file.padEnd(30)} ${meta.width}x${meta.height}  ` +
      `alpha=${meta.hasAlpha}  ${(statSync(file).size / 1024).toFixed(1)} kB`
  );
}

// One-off script to generate the placeholder assets described in the ISBR
// site ticket. Run with: node scripts/generate-placeholders.mjs
// Replace the output files in /public directly when real assets arrive —
// no code change needed.
import sharp from "sharp";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");
mkdirSync(publicDir, { recursive: true });

const DARK_GREEN = "#0B3D2E";
const CREAM = "#F4EEE2";

function logoSvg({ size, circleFill, showBg }) {
  const r = size * 0.485;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = Math.max(2, size * 0.02);
  const fontSize = size * 0.24;
  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  ${showBg ? `<rect width="${size}" height="${size}" fill="${CREAM}"/>` : ""}
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${circleFill}" stroke="${DARK_GREEN}" stroke-width="${strokeWidth}"/>
  <text x="${cx}" y="${cy}" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${fontSize}" fill="${DARK_GREEN}" text-anchor="middle" dominant-baseline="central" letter-spacing="${size * 0.01}">ISBR</text>
</svg>`;
}

function solidJpegSvg({ width, height }) {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="${width}" height="${height}" fill="${DARK_GREEN}"/></svg>`;
}

async function run() {
  // 1. Logo — public/logo.png, 512x512, transparent background circle mark.
  await sharp(Buffer.from(logoSvg({ size: 512, circleFill: "#FFFFFF", showBg: false })))
    .png()
    .toFile(path.join(publicDir, "logo.png"));

  // 2. Apple touch icon — 180x180, opaque cream background (iOS requires opaque).
  await sharp(
    Buffer.from(logoSvg({ size: 180, circleFill: "#FFFFFF", showBg: true }))
  )
    .png()
    .toFile(path.join(publicDir, "apple-touch-icon.png"));

  // 3. Favicon — 48x48 PNG wrapped in a minimal ICO container (PNG-in-ICO,
  // supported by all modern browsers).
  const faviconPng = await sharp(
    Buffer.from(logoSvg({ size: 48, circleFill: "#FFFFFF", showBg: true }))
  )
    .png()
    .toBuffer();
  writeFileSync(path.join(publicDir, "favicon.ico"), pngToIco(faviconPng, 48));

  // 4. Hero photo placeholder — 1600x900, solid color, no text.
  await sharp(Buffer.from(solidJpegSvg({ width: 1600, height: 900 })))
    .jpeg({ quality: 90 })
    .toFile(path.join(publicDir, "hero.jpg"));

  // 5. OG image placeholder — 1200x630, solid color, no text.
  await sharp(Buffer.from(solidJpegSvg({ width: 1200, height: 630 })))
    .jpeg({ quality: 90 })
    .toFile(path.join(publicDir, "og.jpg"));

  console.log("Placeholder assets written to /public");
}

function pngToIco(pngBuffer, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = icon
  header.writeUInt16LE(1, 4); // number of images

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
  entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
  entry.writeUInt8(0, 2); // color palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(pngBuffer.length, 8); // image data size
  entry.writeUInt32LE(header.length + entry.length, 12); // offset

  return Buffer.concat([header, entry, pngBuffer]);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

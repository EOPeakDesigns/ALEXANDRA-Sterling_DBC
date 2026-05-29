import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svgPath = join(root, 'assets/icons/favicon/svg/favicon.svg');
const svg = readFileSync(svgPath);
const outDir = join(root, 'assets/icons/favicon/png');

const icons = [
  ['favicon-16x16.png', 16],
  ['favicon-32x32.png', 32],
  ['apple-touch-icon.png', 180],
  ['android-chrome-192x192.png', 192],
  ['android-chrome-512x512.png', 512]
];

for (const [filename, size] of icons) {
  await sharp(svg, { density: 300 })
    .resize(size, size, { fit: 'contain', background: { r: 127, g: 201, b: 195, alpha: 1 } })
    .png()
    .toFile(join(outDir, filename));

  console.log(`Generated ${filename} (${size}x${size})`);
}

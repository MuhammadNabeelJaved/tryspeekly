// One-off favicon generator: rasterizes public/favicon.svg into PNG + ICO assets.
// Run from client/: node scripts/gen-favicons.mjs
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import sharp from 'sharp'
import pngToIco from 'png-to-ico'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
const svgPath = join(publicDir, 'favicon.svg')
const BRAND_BG = '#7c3aed'

const svg = await readFile(svgPath)

// Transparent-background PNGs (multiples of 48 where possible)
const pngSizes = [48, 96, 192, 512]
for (const size of pngSizes) {
  const out = join(publicDir, `favicon-${size}x${size}.png`)
  await sharp(svg, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(out)
  console.log('wrote', out)
}

// Apple touch icon: solid brand background (iOS adds its own rounding)
const appleOut = join(publicDir, 'apple-touch-icon.png')
await sharp(svg, { density: 384 })
  .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .flatten({ background: BRAND_BG })
  .png()
  .toFile(appleOut)
console.log('wrote', appleOut)

// favicon.ico from 16/32/48 PNG buffers
const icoBuffers = await Promise.all(
  [16, 32, 48].map((size) =>
    sharp(svg, { density: 384 })
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
  )
)
const icoOut = join(publicDir, 'favicon.ico')
await writeFile(icoOut, await pngToIco(icoBuffers))
console.log('wrote', icoOut)

console.log('Done.')

// RECOLOR SPRITES
// For ALL animations and ALL frames at once:
//   1. Makes the frames big, with sharp square pixels (so they are not blurry in the app)
//   2. Makes new colors of your slime: one new color, keeping the light and shadows
//
// How to use (from the project folder):
//   1. npm install --save-dev pngjs
//   2. Change the SETTINGS below
//   3. node scripts/recolor.js
//
// Your small original frames are kept in a "purple_small" folder, next to "purple".
// You can run the script as many times as you want: big frames are never enlarged twice.

//Imports
const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

// SETTINGS

// The folder with all your animations. Each animation has a folder per color inside:
//   components/animation/idleBack/purple/idle_back_1.png
//   components/animation/slurp/purple/...
const ROOT = "components/animation";

// The original color folder (the one you drew)
const BASE = "purple";

// How big the frames should be (in pixels). 28 x 20 = 560.
// Big enough for the phone to show sharp pixels, without blur.
const TARGET_SIZE = 560;

// The colors to make. Every part of the slime gets painted in the SAME color,
// only the light and the shadows are kept. For each one:
//   color      the color, on the color wheel (0-360):
//              0 red · 30 orange · 55 yellow · 120 green · 180 cyan · 220 blue · 280 purple · 320 pink
//   saturation how strong the color is. 1 = same as the original, 1.3 = deeper, 0.6 = paler
//   lightness  how bright it is. 1 = same, 0.85 = darker, 1.1 = lighter
//   contrast   the difference between light and shadow. 1 = same, 1.5 = stronger shadows and highlights
// Only "color" is needed: the others are 1 if you don't write them.
// Try values and look! Run the script again to replace them.
const VARIANTS = {
  green: { color: 125, saturation: 1.2, lightness: 0.8, contrast: 1.6 },
  blue: { color: 205, saturation: 1.8, lightness: 0.8, contrast: 1.2 }, // electric blue
  pink: { color: 330 },
  red: { color: 345, saturation: 1.5, lightness: 0.65, contrast: 1.5 }, // a bit toward crimson, so it's not the apple's red
  orange: { color: 25, saturation: 2, lightness: 0.7, contrast: 1.2 },
  yellow: { color: 48, saturation: 2, lightness: 0.72, contrast: 1.8 }, // strong yellow
  black: { color: 260, saturation: 0.3, lightness: 0.4, contrast: 1.8 }, // a tiny bit of purple, so it's not flat grey
};

// Colors that must NOT change (e.g. the eyes). Use the color picker in your editor to find them.
// Example: ["#3b1f2b", "#6b2f45"]
const KEEP = ["#FC0000", "#6E0D0D", "#2DFC00"]; // the apple: red, dark red, green leaf

// HELPERS

// "#3b1f2b" -> "59,31,43" (easy to compare)
function hexToKey(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}
const KEEP_KEYS = new Set(KEEP.map(hexToKey));

// Red/green/blue (0-255) -> hue (0-360), saturation (0-1), lightness (0-1)
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l]; // grey: no color to turn
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

// Hue, saturation, lightness -> red/green/blue (0-255)
function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

// Every .png file in a folder, in the right order (frame 2 before frame 10)
function findPngs(folder) {
  return fs
    .readdirSync(folder)
    .filter((name) => name.toLowerCase().endsWith(".png"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((name) => path.join(folder, name));
}

// Every animation folder that has a BASE color folder inside (idleBack, slurp...)
function findAnimations() {
  return fs
    .readdirSync(ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(ROOT, entry.name))
    .filter((folder) => fs.existsSync(path.join(folder, BASE)));
}

// ENLARGE ONE IMAGE
// Each pixel becomes a square of pixels of the same color (no blur, like Piskel's export scale).

function enlarge(png) {
  const factor = Math.round(TARGET_SIZE / png.width);
  if (factor <= 1) return null; // already big enough: nothing to do

  const big = new PNG({ width: png.width * factor, height: png.height * factor });
  for (let y = 0; y < big.height; y++) {
    for (let x = 0; x < big.width; x++) {
      const from = (Math.floor(y / factor) * png.width + Math.floor(x / factor)) * 4; // the small pixel
      const to = (y * big.width + x) * 4;                                             // the big pixel
      png.data.copy(big.data, to, from, from + 4);
    }
  }
  return big;
}

// RECOLOR ONE IMAGE

// Keeps a number between 0 and 1
const clamp = (n) => Math.min(1, Math.max(0, n));

function recolor(file, { color, saturation = 1, lightness = 1, contrast = 1 }) {
  const png = PNG.sync.read(fs.readFileSync(file));
  const data = png.data; // 4 numbers per pixel: red, green, blue, transparency

  // The average brightness of the slime: contrast pushes the other pixels away from it
  let total = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    total += rgbToHsl(data[i], data[i + 1], data[i + 2])[2] * lightness;
    count++;
  }
  const middle = count > 0 ? total / count : 0.5;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue; // transparent pixel: skip
    const key = `${data[i]},${data[i + 1]},${data[i + 2]}`;
    if (KEEP_KEYS.has(key)) continue; // protected color (eyes...): skip

    const [, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]); // the old color is not needed
    const bright = l * lightness;                         // darker or lighter
    const contrasted = middle + (bright - middle) * contrast; // shadows darker, highlights lighter
    const [r, g, b] = hslToRgb(
      color % 360,           // every pixel gets the same color...
      clamp(s * saturation), // ...as strong as before (or deeper / paler)...
      clamp(contrasted)      // ...with its light and shadow
    );
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
  return PNG.sync.write(png);
}

// RUN

const animations = findAnimations();
if (animations.length === 0) {
  console.log(`No "${BASE}" folder found in "${ROOT}". Check the ROOT and BASE settings.`);
  process.exit(1);
}

for (const animation of animations) {
  const files = findPngs(path.join(animation, BASE));

  // 1. Enlarge the original frames (only the small ones), and keep the small ones as a backup
  let enlarged = 0;
  for (const file of files) {
    const big = enlarge(PNG.sync.read(fs.readFileSync(file)));
    if (!big) continue; // already big

    const backupFolder = path.join(animation, `${BASE}_small`);
    fs.mkdirSync(backupFolder, { recursive: true });
    fs.copyFileSync(file, path.join(backupFolder, path.basename(file)));
    fs.writeFileSync(file, PNG.sync.write(big));
    enlarged++;
  }
  if (enlarged > 0) console.log(`${path.basename(animation)}: ${enlarged} frames enlarged`);

  // 2. Make the other colors from the (now big) original frames
  for (const [name, settings] of Object.entries(VARIANTS)) {
    // e.g. components/animation/slurp/purple -> components/animation/slurp/green
    const outputFolder = path.join(animation, name);
    fs.mkdirSync(outputFolder, { recursive: true });

    for (const file of files) {
      fs.writeFileSync(path.join(outputFolder, path.basename(file)), recolor(file, settings));
    }
  }
  console.log(`${path.basename(animation)}: ${files.length} frames x ${Object.keys(VARIANTS).length} colors`);
}

// 3. Write the list of all frames for the app: components/animation/frames.ts
// (the app can't read folders, it needs one require(...) per image: this writes them all for you)

const colors = [BASE, ...Object.keys(VARIANTS)];
let code =
  "// MADE BY scripts/recolor.js: don't change this file by hand, run the script again instead.\n" +
  "// FRAMES[color][animation] = the list of frames, in order.\n\n" +
  "export const FRAMES = {\n";

for (const color of colors) {
  code += `  ${color}: {\n`;
  for (const animation of animations) {
    const name = path.basename(animation);
    code += `    ${name}: [\n`;
    for (const file of findPngs(path.join(animation, color))) {
      code += `      require("./${name}/${color}/${path.basename(file)}"),\n`;
    }
    code += "    ],\n";
  }
  code += "  },\n";
}

code +=
  "};\n\n" +
  "// The names, for TypeScript\n" +
  "export type SlimeColor = keyof typeof FRAMES;\n" +
  `export type AnimationName = keyof typeof FRAMES["${BASE}"];\n\n` +
  "// Every color, in order (useful to try them all)\n" +
  "export const COLORS = Object.keys(FRAMES) as SlimeColor[];\n";

fs.writeFileSync(path.join(ROOT, "frames.ts"), code);
console.log(`frames.ts written: ${colors.length} colors x ${animations.length} animations`);
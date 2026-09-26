/**
 * Standalone Zero-Dependency Sprite Sheet Generator for Simple OTP Pets
 * Produces 16-frame horizontal sprite sheets (2048x128 px, 16 frames of 128x128 px)
 * for Cipher Cat, Byte Dog, and Shield Bunny across 4 states:
 * - Frames 0-3: IDLE
 * - Frames 4-7: COPIED
 * - Frames 8-11: WARNING
 * - Frames 12-15: EMPTY
 *
 * Uses pure Node.js (Buffer + zlib) to output valid 32-bit RGBA PNG files with transparency.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// --- CRC32 & PNG Chunk Utilities ---
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'binary');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([lenBuf, typeAndData, crcBuf]);
}

function encodePng(width, height, rgbaBuffer) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // 8 bits per channel
  ihdrData[9] = 6;  // RGBA color type
  ihdrData[10] = 0; // compression deflate
  ihdrData[11] = 0; // standard filter
  ihdrData[12] = 0; // no interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Add scanline filter byte (0 = None) before each row
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  let srcOffset = 0;
  let dstOffset = 0;
  for (let y = 0; y < height; y++) {
    scanlines[dstOffset++] = 0;
    rgbaBuffer.copy(scanlines, dstOffset, srcOffset, srcOffset + width * 4);
    dstOffset += width * 4;
    srcOffset += width * 4;
  }

  const compressed = zlib.deflateSync(scanlines, { level: 9 });
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// --- 2D Rasterizer & Drawing Canvas ---
class Canvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.buffer = Buffer.alloc(width * height * 4, 0); // 32-bit RGBA, 0 = transparent
  }

  setPixel(x, y, r, g, b, a = 255) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const idx = (y * this.width + x) * 4;
    if (a >= 255) {
      this.buffer[idx] = r;
      this.buffer[idx + 1] = g;
      this.buffer[idx + 2] = b;
      this.buffer[idx + 3] = 255;
    } else if (a > 0) {
      const srcA = a / 255;
      const dstA = this.buffer[idx + 3] / 255;
      const outA = srcA + dstA * (1 - srcA);
      if (outA > 0) {
        this.buffer[idx] = Math.round((r * srcA + this.buffer[idx] * dstA * (1 - srcA)) / outA);
        this.buffer[idx + 1] = Math.round((g * srcA + this.buffer[idx + 1] * dstA * (1 - srcA)) / outA);
        this.buffer[idx + 2] = Math.round((b * srcA + this.buffer[idx + 2] * dstA * (1 - srcA)) / outA);
        this.buffer[idx + 3] = Math.round(outA * 255);
      }
    }
  }

  fillRect(x, y, w, h, r, g, b, a = 255) {
    for (let py = Math.round(y); py < Math.round(y + h); py++) {
      for (let px = Math.round(x); px < Math.round(x + w); px++) {
        this.setPixel(px, py, r, g, b, a);
      }
    }
  }

  fillCircle(cx, cy, radius, r, g, b, a = 255) {
    const r2 = radius * radius;
    for (let py = Math.floor(cy - radius); py <= Math.ceil(cy + radius); py++) {
      for (let px = Math.floor(cx - radius); px <= Math.ceil(cx + radius); px++) {
        const d2 = (px - cx) * (px - cx) + (py - cy) * (py - cy);
        if (d2 <= r2) {
          this.setPixel(px, py, r, g, b, a);
        }
      }
    }
  }

  drawCircle(cx, cy, radius, thickness = 1, r = 255, g = 255, b = 255, a = 255) {
    const rOuter2 = (radius + thickness) * (radius + thickness);
    const rInner2 = Math.max(0, radius - thickness) * Math.max(0, radius - thickness);
    for (let py = Math.floor(cy - radius - thickness); py <= Math.ceil(cy + radius + thickness); py++) {
      for (let px = Math.floor(cx - radius - thickness); px <= Math.ceil(cx + radius + thickness); px++) {
        const d2 = (px - cx) * (px - cx) + (py - cy) * (py - cy);
        if (d2 <= rOuter2 && d2 >= rInner2) {
          this.setPixel(px, py, r, g, b, a);
        }
      }
    }
  }

  fillEllipse(cx, cy, rx, ry, r, g, b, a = 255) {
    const rx2 = rx * rx;
    const ry2 = ry * ry;
    for (let py = Math.floor(cy - ry); py <= Math.ceil(cy + ry); py++) {
      for (let px = Math.floor(cx - rx); px <= Math.ceil(cx + rx); px++) {
        const val = ((px - cx) * (px - cx)) / rx2 + ((py - cy) * (py - cy)) / ry2;
        if (val <= 1.0) {
          this.setPixel(px, py, r, g, b, a);
        }
      }
    }
  }

  fillRoundedRect(x, y, w, h, radius, r, g, b, a = 255) {
    this.fillRect(x + radius, y, w - 2 * radius, h, r, g, b, a);
    this.fillRect(x, y + radius, radius, h - 2 * radius, r, g, b, a);
    this.fillRect(x + w - radius, y + radius, radius, h - 2 * radius, r, g, b, a);
    this.fillCircle(x + radius, y + radius, radius, r, g, b, a);
    this.fillCircle(x + w - radius, y + radius, radius, r, g, b, a);
    this.fillCircle(x + radius, y + h - radius, radius, r, g, b, a);
    this.fillCircle(x + w - radius, y + h - radius, radius, r, g, b, a);
  }

  fillTriangle(x0, y0, x1, y1, x2, y2, r, g, b, a = 255) {
    const minX = Math.floor(Math.min(x0, x1, x2));
    const maxX = Math.ceil(Math.max(x0, x1, x2));
    const minY = Math.floor(Math.min(y0, y1, y2));
    const maxY = Math.ceil(Math.max(y0, y1, y2));

    const dX21 = x2 - x1;
    const dY12 = y1 - y2;
    const D = dY12 * (x0 - x2) + dX21 * (y0 - y2);

    for (let py = minY; py <= maxY; py++) {
      for (let px = minX; px <= maxX; px++) {
        const dX = px - x2;
        const dY = py - y2;
        const s = dY12 * dX + dX21 * dY;
        const t = (y2 - y0) * dX + (x0 - x2) * dY;
        let inside = false;
        if (D > 0) inside = s >= 0 && t >= 0 && s + t <= D;
        else inside = s <= 0 && t <= 0 && s + t >= D;
        if (inside) {
          this.setPixel(px, py, r, g, b, a);
        }
      }
    }
  }

  drawSparkle(cx, cy, size, r, g, b, a = 255) {
    this.fillEllipse(cx, cy, size, Math.max(1, size / 4), r, g, b, a);
    this.fillEllipse(cx, cy, Math.max(1, size / 4), size, r, g, b, a);
    this.fillCircle(cx, cy, Math.max(1, size / 3), 255, 255, 255, a);
  }

  drawStar(cx, cy, rOut, rIn, r, g, b, a = 255) {
    this.drawSparkle(cx, cy, rOut, r, g, b, a);
  }

  drawPlus(cx, cy, size, thickness, r, g, b, a = 255) {
    this.fillRect(cx - size, cy - thickness / 2, size * 2, thickness, r, g, b, a);
    this.fillRect(cx - thickness / 2, cy - size, thickness, size * 2, r, g, b, a);
  }

  drawExclamation(cx, cy, size, r, g, b, a = 255) {
    this.fillRoundedRect(cx - 2, cy - size, 4, size - 5, 2, r, g, b, a);
    this.fillCircle(cx, cy, 2, r, g, b, a);
  }

  drawSweatDrop(cx, cy, size, r, g, b, a = 255) {
    this.fillCircle(cx, cy + size / 2, size / 2, r, g, b, a);
    this.fillTriangle(cx, cy - size / 2, cx - size / 2, cy + size / 3, cx + size / 2, cy + size / 3, r, g, b, a);
    this.fillCircle(cx - 1, cy + size / 3, 1, 255, 255, 255, 200);
  }

  toPng() {
    return encodePng(this.width, this.height, this.buffer);
  }
}

// --- Pet Sprite Renderers ---

const FRAME_SIZE = 128;
const NUM_FRAMES = 16;
const SHEET_WIDTH = FRAME_SIZE * NUM_FRAMES; // 2048 px
const SHEET_HEIGHT = FRAME_SIZE;             // 128 px

/**
 * Render Cipher Cat (Cyber Analytical Cat)
 */
function renderCipherCat() {
  const canvas = new Canvas(SHEET_WIDTH, SHEET_HEIGHT);

  for (let f = 0; f < NUM_FRAMES; f++) {
    const fx = f * FRAME_SIZE;
    const cx = fx + 64;
    let cy = 64;

    const state = Math.floor(f / 4); // 0: IDLE, 1: COPIED, 2: WARNING, 3: EMPTY
    const subFrame = f % 4;

    // State dynamic adjustments
    let dy = 0;
    let bounce = 0;
    let tailAngle = 0;
    let visorColor = [34, 211, 238]; // Neon Cyan
    let earTwitch = 0;

    if (state === 0) { // IDLE
      if (subFrame === 1) { dy = -2; tailAngle = 1; }
      else if (subFrame === 2) { earTwitch = 1; }
      else if (subFrame === 3) { dy = 0; tailAngle = -1; }
    } else if (state === 1) { // COPIED
      if (subFrame === 0) { dy = 4; }
      else if (subFrame === 1) { dy = -14; bounce = 1; visorColor = [251, 191, 36]; }
      else if (subFrame === 2) { dy = -18; bounce = 2; visorColor = [251, 191, 36]; }
      else if (subFrame === 3) { dy = -4; visorColor = [34, 211, 238]; }
    } else if (state === 2) { // WARNING
      visorColor = [239, 68, 68]; // Red Alert
      if (subFrame === 1) { dy = -1; }
      else if (subFrame === 2) { dy = 1; }
      else if (subFrame === 3) { dy = -2; }
    } else if (state === 3) { // EMPTY
      if (subFrame === 1) { dy = -1; }
      else if (subFrame === 2) { dy = -2; }
      else if (subFrame === 3) { dy = -1; }
    }

    const py = cy + dy;

    // 1. Tail (Sleek tech cyber tail)
    const tailX = cx + 22 + (tailAngle * 4);
    const tailY = py + 26;
    canvas.fillEllipse(tailX, tailY, 6, 18, 30, 41, 59);
    canvas.fillCircle(tailX + 4, tailY - 14, 5, 49, 46, 129);
    canvas.fillCircle(tailX + 6, tailY - 18, 3, 34, 211, 238); // glowing tail tip

    // 2. Body
    canvas.fillEllipse(cx, py + 24, 26, 22, 30, 41, 59); // dark indigo body
    canvas.fillEllipse(cx, py + 24, 16, 15, 79, 70, 229); // chest patch

    // 3. Cat Ears (Pointy & sharp)
    const earL_x = cx - 18 + earTwitch;
    const earR_x = cx + 18 - earTwitch;
    // Outer ears
    canvas.fillTriangle(earL_x - 10, py - 4, earL_x + 10, py - 4, earL_x - 4, py - 28, 30, 41, 59);
    canvas.fillTriangle(earR_x - 10, py - 4, earR_x + 10, py - 4, earR_x + 4, py - 28, 30, 41, 59);
    // Inner ears
    canvas.fillTriangle(earL_x - 6, py - 4, earL_x + 6, py - 4, earL_x - 2, py - 22, 244, 114, 182);
    canvas.fillTriangle(earR_x - 6, py - 4, earR_x + 6, py - 4, earR_x + 2, py - 22, 244, 114, 182);

    // 4. Head
    canvas.fillCircle(cx, py, 24, 30, 41, 59);

    // 5. Whiskers
    canvas.fillRect(cx - 30, py + 4, 8, 2, 99, 102, 241, 180);
    canvas.fillRect(cx - 32, py + 9, 10, 2, 99, 102, 241, 180);
    canvas.fillRect(cx + 22, py + 4, 8, 2, 99, 102, 241, 180);
    canvas.fillRect(cx + 22, py + 9, 10, 2, 99, 102, 241, 180);

    // 6. Cyber Visor / Eyes
    if (state === 0 && subFrame === 2) {
      // Visor happy blink ^ ^
      canvas.fillRoundedRect(cx - 16, py - 4, 12, 4, 2, visorColor[0], visorColor[1], visorColor[2]);
      canvas.fillRoundedRect(cx + 4, py - 4, 12, 4, 2, visorColor[0], visorColor[1], visorColor[2]);
    } else if (state === 1) {
      // Visor sparkle joyful curves
      canvas.fillRoundedRect(cx - 18, py - 6, 14, 8, 4, visorColor[0], visorColor[1], visorColor[2]);
      canvas.fillRoundedRect(cx + 4, py - 6, 14, 8, 4, visorColor[0], visorColor[1], visorColor[2]);
      canvas.fillCircle(cx - 11, py - 2, 2, 255, 255, 255);
      canvas.fillCircle(cx + 11, py - 2, 2, 255, 255, 255);
    } else {
      // Visor Bar
      canvas.fillRoundedRect(cx - 18, py - 6, 36, 10, 5, visorColor[0], visorColor[1], visorColor[2]);
      canvas.fillRoundedRect(cx - 14, py - 4, 28, 4, 2, 255, 255, 255, 180); // reflection shine
    }

    // 7. Cute Nose & Mouth
    canvas.fillTriangle(cx - 3, py + 7, cx + 3, py + 7, cx, py + 10, 244, 114, 182);

    // 8. Collar & Key Tag
    canvas.fillRoundedRect(cx - 16, py + 16, 32, 6, 3, 37, 99, 235);
    canvas.fillCircle(cx, py + 22, 5, 251, 191, 36); // golden security key tag
    canvas.fillRect(cx - 1, py + 22, 2, 5, 251, 191, 36);

    // 9. Paws
    if (state === 1 && (subFrame === 1 || subFrame === 2)) {
      // Paws raised high in celebration
      canvas.fillCircle(cx - 20, py - 10, 6, 248, 250, 252);
      canvas.fillCircle(cx + 20, py - 10, 6, 248, 250, 252);
    } else {
      canvas.fillCircle(cx - 12, py + 40, 6, 248, 250, 252);
      canvas.fillCircle(cx + 12, py + 40, 6, 248, 250, 252);
    }

    // 10. State Overlays
    if (state === 1) { // COPIED Celebration Sparkles
      canvas.drawSparkle(cx - 28, py - 20, 8, 251, 191, 36);
      canvas.drawSparkle(cx + 28, py - 22, 10, 251, 191, 36);
      if (subFrame === 2) {
        canvas.drawSparkle(cx, py - 32, 12, 255, 255, 255);
        canvas.drawSparkle(cx + 34, py, 6, 34, 211, 238);
      }
    } else if (state === 2) { // WARNING Alert Signs
      canvas.drawSweatDrop(cx + 22, py - 12, 7, 56, 189, 248);
      canvas.drawExclamation(cx, py - 32, 14, 239, 68, 68);
      if (subFrame === 2 || subFrame === 3) {
        canvas.drawSweatDrop(cx - 22, py - 8, 6, 56, 189, 248);
      }
    } else if (state === 3) { // EMPTY sign with [+]
      // Hologram Sign
      canvas.fillRoundedRect(cx - 22, py + 12, 44, 26, 4, 15, 23, 42, 220); // dark cyan slate
      canvas.fillRoundedRect(cx - 20, py + 14, 40, 22, 3, 34, 211, 238, 240); // neon cyan frame
      canvas.fillRoundedRect(cx - 18, py + 16, 36, 18, 2, 15, 23, 42, 240);
      canvas.drawPlus(cx, py + 25, 6, 3, 34, 211, 238); // glowing [+] button
      // Little paw holding sign
      canvas.fillCircle(cx - 16, py + 24, 4, 248, 250, 252);
      canvas.fillCircle(cx + 16, py + 24, 4, 248, 250, 252);
      // Small invitation star
      canvas.drawSparkle(cx + 24, py + 8, 5, 251, 191, 36);
    }
  }

  return canvas.toPng();
}

/**
 * Render Byte Dog (Energetic Guard Puppy)
 */
function renderByteDog() {
  const canvas = new Canvas(SHEET_WIDTH, SHEET_HEIGHT);

  for (let f = 0; f < NUM_FRAMES; f++) {
    const fx = f * FRAME_SIZE;
    const cx = fx + 64;
    let cy = 64;

    const state = Math.floor(f / 4);
    const subFrame = f % 4;

    let dy = 0;
    let tailWag = 0;
    let earAngle = 0;
    let tongueOut = false;

    if (state === 0) { // IDLE
      if (subFrame === 1) { tailWag = -8; earAngle = -2; tongueOut = true; }
      else if (subFrame === 2) { tailWag = 8; earAngle = 2; dy = -1; }
      else if (subFrame === 3) { tailWag = 0; earAngle = 0; tongueOut = true; }
    } else if (state === 1) { // COPIED
      if (subFrame === 0) { dy = 4; tailWag = -10; }
      else if (subFrame === 1) { dy = -14; earAngle = -6; tongueOut = true; tailWag = 12; }
      else if (subFrame === 2) { dy = -20; earAngle = -8; tongueOut = true; tailWag = -12; }
      else if (subFrame === 3) { dy = -4; earAngle = 0; tailWag = 8; }
    } else if (state === 2) { // WARNING
      earAngle = 6; // flattened ears
      if (subFrame === 1) dy = -1;
      else if (subFrame === 2) dy = 1;
      else if (subFrame === 3) dy = -2;
    } else if (state === 3) { // EMPTY
      if (subFrame === 1) dy = -1;
      else if (subFrame === 2) dy = -2;
    }

    const py = cy + dy;

    // 1. Tail (Happy wagging golden tail)
    const tx = cx + 24 + tailWag;
    const ty = py + 26;
    canvas.fillEllipse(tx, ty, 7, 18, 217, 119, 6);
    canvas.fillCircle(tx + (tailWag > 0 ? 3 : -3), ty - 12, 5, 254, 243, 199);

    // 2. Body (Golden amber puppy)
    canvas.fillEllipse(cx, py + 24, 26, 22, 245, 158, 11);
    canvas.fillEllipse(cx, py + 25, 16, 16, 254, 243, 199); // cream chest

    // 3. Floppy Dog Ears (Rich brown)
    const earL_x = cx - 22;
    const earR_x = cx + 22;
    canvas.fillEllipse(earL_x + earAngle, py - 4 + Math.abs(earAngle), 9, 20, 146, 64, 14);
    canvas.fillEllipse(earR_x - earAngle, py - 4 + Math.abs(earAngle), 9, 20, 146, 64, 14);

    // 4. Head
    canvas.fillCircle(cx, py, 24, 245, 158, 11);

    // 5. Muzzle (Cream white)
    canvas.fillEllipse(cx, py + 7, 16, 12, 254, 243, 199);

    // 6. Eyes
    if (state === 0 && subFrame === 2) {
      // Happy winking eyes ^ ^
      canvas.fillRoundedRect(cx - 14, py - 4, 8, 3, 1, 28, 25, 23);
      canvas.fillRoundedRect(cx + 6, py - 4, 8, 3, 1, 28, 25, 23);
    } else if (state === 2) {
      // Wide alarmed eyes O O
      canvas.fillCircle(cx - 10, py - 3, 6, 28, 25, 23);
      canvas.fillCircle(cx + 10, py - 3, 6, 28, 25, 23);
      canvas.fillCircle(cx - 11, py - 4, 2, 255, 255, 255);
      canvas.fillCircle(cx + 9, py - 4, 2, 255, 255, 255);
    } else {
      // Normal friendly puppy eyes
      canvas.fillCircle(cx - 10, py - 3, 5, 28, 25, 23);
      canvas.fillCircle(cx + 10, py - 3, 5, 28, 25, 23);
      canvas.fillCircle(cx - 11, py - 4, 2, 255, 255, 255);
      canvas.fillCircle(cx + 9, py - 4, 2, 255, 255, 255);
    }

    // 7. Shiny Nose & Tongue
    canvas.fillEllipse(cx, py + 4, 5, 4, 28, 25, 23);
    if (tongueOut) {
      canvas.fillEllipse(cx, py + 14, 5, 7, 251, 113, 133); // pink panting tongue
    }

    // 8. Collar & Golden Security Shield Tag
    canvas.fillRoundedRect(cx - 16, py + 16, 32, 6, 3, 37, 99, 235); // blue collar
    canvas.fillCircle(cx, py + 22, 6, 251, 191, 36); // gold medal tag
    canvas.fillCircle(cx, py + 22, 4, 245, 158, 11);

    // 9. Paws
    if (state === 1 && (subFrame === 1 || subFrame === 2)) {
      canvas.fillCircle(cx - 20, py - 10, 7, 254, 243, 199);
      canvas.fillCircle(cx + 20, py - 10, 7, 254, 243, 199);
    } else {
      canvas.fillCircle(cx - 12, py + 40, 7, 254, 243, 199);
      canvas.fillCircle(cx + 12, py + 40, 7, 254, 243, 199);
    }

    // 10. State Overlays
    if (state === 1) { // COPIED Sparkles & Bone
      canvas.drawSparkle(cx - 28, py - 20, 9, 251, 191, 36);
      canvas.drawSparkle(cx + 28, py - 22, 10, 251, 191, 36);
      // Small golden bone
      canvas.fillRoundedRect(cx - 10, py - 32, 20, 5, 2, 254, 243, 199);
      canvas.fillCircle(cx - 10, py - 33, 4, 254, 243, 199);
      canvas.fillCircle(cx - 10, py - 29, 4, 254, 243, 199);
      canvas.fillCircle(cx + 10, py - 33, 4, 254, 243, 199);
      canvas.fillCircle(cx + 10, py - 29, 4, 254, 243, 199);
    } else if (state === 2) { // WARNING Alert
      canvas.drawSweatDrop(cx + 22, py - 12, 7, 56, 189, 248);
      canvas.drawExclamation(cx, py - 32, 14, 239, 68, 68);
    } else if (state === 3) { // EMPTY sign with [+]
      canvas.fillRoundedRect(cx - 22, py + 12, 44, 26, 4, 180, 83, 9); // amber wood
      canvas.fillRoundedRect(cx - 20, py + 14, 40, 22, 3, 254, 243, 199); // cream sign
      canvas.drawPlus(cx, py + 25, 6, 3, 217, 119, 6);
      canvas.fillCircle(cx - 16, py + 24, 4, 254, 243, 199);
      canvas.fillCircle(cx + 16, py + 24, 4, 254, 243, 199);
      canvas.drawSparkle(cx + 24, py + 8, 5, 245, 158, 11);
    }
  }

  return canvas.toPng();
}

/**
 * Render Shield Bunny (Vigilant Backup Bunny)
 */
function renderShieldBunny() {
  const canvas = new Canvas(SHEET_WIDTH, SHEET_HEIGHT);

  for (let f = 0; f < NUM_FRAMES; f++) {
    const fx = f * FRAME_SIZE;
    const cx = fx + 64;
    let cy = 64;

    const state = Math.floor(f / 4);
    const subFrame = f % 4;

    let dy = 0;
    let earTwitchL = 0;
    let earTwitchR = 0;
    let shieldLift = 0;

    if (state === 0) { // IDLE
      if (subFrame === 1) { earTwitchL = -4; dy = -1; }
      else if (subFrame === 2) { earTwitchR = 4; }
      else if (subFrame === 3) { dy = 0; }
    } else if (state === 1) { // COPIED
      if (subFrame === 0) { dy = 3; }
      else if (subFrame === 1) { dy = -14; shieldLift = -18; earTwitchL = -6; earTwitchR = 6; }
      else if (subFrame === 2) { dy = -20; shieldLift = -22; earTwitchL = -8; earTwitchR = 8; }
      else if (subFrame === 3) { dy = -4; shieldLift = -4; }
    } else if (state === 2) { // WARNING
      earTwitchL = 8; earTwitchR = -8; // ears pinned back
      shieldLift = -6; // shield held up high for protection
      if (subFrame === 1) dy = -1;
      else if (subFrame === 2) dy = 1;
      else if (subFrame === 3) dy = -2;
    } else if (state === 3) { // EMPTY
      if (subFrame === 1) dy = -1;
      else if (subFrame === 2) dy = -2;
    }

    const py = cy + dy;

    // 1. Pom-pom tail
    canvas.fillCircle(cx + 24, py + 26, 8, 248, 250, 252);
    canvas.fillCircle(cx + 24, py + 26, 6, 255, 255, 255);

    // 2. Body (Fluffy white bunny)
    canvas.fillEllipse(cx, py + 24, 25, 21, 241, 245, 249);
    canvas.fillEllipse(cx, py + 24, 17, 16, 255, 255, 255);

    // 3. Long Bunny Ears
    const earL_x = cx - 12 + earTwitchL;
    const earR_x = cx + 12 + earTwitchR;
    // Outer ears
    canvas.fillEllipse(earL_x, py - 24, 8, 24, 248, 250, 252);
    canvas.fillEllipse(earR_x, py - 24, 8, 24, 248, 250, 252);
    // Inner ears (pink)
    canvas.fillEllipse(earL_x, py - 24, 4, 18, 251, 207, 232);
    canvas.fillEllipse(earR_x, py - 24, 4, 18, 251, 207, 232);

    // 4. Head
    canvas.fillCircle(cx, py, 23, 248, 250, 252);

    // 5. Cheeks (Rosy pink blush)
    canvas.fillCircle(cx - 14, py + 8, 5, 253, 164, 175, 160);
    canvas.fillCircle(cx + 14, py + 8, 5, 253, 164, 175, 160);

    // 6. Eyes (Amethyst purple)
    if (state === 0 && subFrame === 2) {
      canvas.fillRoundedRect(cx - 12, py - 3, 7, 3, 1, 124, 58, 237);
      canvas.fillRoundedRect(cx + 5, py - 3, 7, 3, 1, 124, 58, 237);
    } else if (state === 1) {
      // Happy > < eyes
      canvas.fillTriangle(cx - 14, py - 5, cx - 6, py - 2, cx - 14, py + 1, 124, 58, 237);
      canvas.fillTriangle(cx + 14, py - 5, cx + 6, py - 2, cx + 14, py + 1, 124, 58, 237);
    } else {
      canvas.fillCircle(cx - 9, py - 2, 5, 124, 58, 237);
      canvas.fillCircle(cx + 9, py - 2, 5, 124, 58, 237);
      canvas.fillCircle(cx - 10, py - 3, 2, 255, 255, 255);
      canvas.fillCircle(cx + 8, py - 3, 2, 255, 255, 255);
    }

    // 7. Pink Nose & Whiskers
    canvas.fillTriangle(cx - 3, py + 5, cx + 3, py + 5, cx, py + 8, 251, 113, 133);
    canvas.fillRect(cx - 24, py + 5, 7, 1, 203, 213, 225);
    canvas.fillRect(cx - 25, py + 9, 8, 1, 203, 213, 225);
    canvas.fillRect(cx + 17, py + 5, 7, 1, 203, 213, 225);
    canvas.fillRect(cx + 17, py + 9, 8, 1, 203, 213, 225);

    // 8. Emerald Security Shield
    const sx = cx + (state === 3 ? 0 : 16);
    const sy = py + 18 + shieldLift;
    // Shield Body (emerald green)
    canvas.fillRoundedRect(sx - 12, sy - 14, 24, 22, 5, 16, 185, 129);
    canvas.fillTriangle(sx - 12, sy + 6, sx + 12, sy + 6, sx, sy + 18, 16, 185, 129);
    // Shield Rim (silver/white)
    canvas.fillRoundedRect(sx - 9, sy - 11, 18, 16, 3, 5, 150, 105);
    canvas.fillTriangle(sx - 9, sy + 4, sx + 9, sy + 4, sx, sy + 13, 5, 150, 105);

    // Shield Emblem (Lock or [+])
    if (state === 3) {
      canvas.drawPlus(sx, sy, 5, 2, 255, 255, 255);
    } else {
      // Tiny silver padlock
      canvas.fillRoundedRect(sx - 4, sy - 2, 8, 7, 2, 255, 255, 255);
      canvas.drawCircle(sx, sy - 4, 3, 1, 255, 255, 255);
    }

    // 9. Paws
    canvas.fillCircle(cx - 10, py + 38, 6, 248, 250, 252);
    canvas.fillCircle(cx + 10, py + 38, 6, 248, 250, 252);

    // 10. State Overlays
    if (state === 1) { // COPIED Diamond sparkles
      canvas.drawSparkle(cx - 28, py - 20, 8, 52, 211, 153);
      canvas.drawSparkle(cx + 28, py - 22, 10, 52, 211, 153);
      if (subFrame === 2) {
        canvas.drawSparkle(sx, sy - 26, 12, 255, 255, 255);
      }
    } else if (state === 2) { // WARNING Alert
      canvas.drawSweatDrop(cx - 20, py - 10, 7, 56, 189, 248);
      canvas.drawExclamation(cx, py - 32, 14, 239, 68, 68);
    } else if (state === 3) { // EMPTY Encouragement
      canvas.drawSparkle(cx - 24, py + 8, 6, 16, 185, 129);
      canvas.drawSparkle(cx + 24, py + 8, 6, 16, 185, 129);
    }
  }

  return canvas.toPng();
}

// --- Main Execution ---
function generateAllPetSprites(outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Generating sprite sheets to: ${outputDir}`);

  const catPng = renderCipherCat();
  fs.writeFileSync(path.join(outputDir, 'cipher-cat-sprites.png'), catPng);
  console.log(`✓ cipher-cat-sprites.png (${catPng.length} bytes, 2048x128)`);

  const dogPng = renderByteDog();
  fs.writeFileSync(path.join(outputDir, 'byte-dog-sprites.png'), dogPng);
  console.log(`✓ byte-dog-sprites.png (${dogPng.length} bytes, 2048x128)`);

  const bunnyPng = renderShieldBunny();
  fs.writeFileSync(path.join(outputDir, 'shield-bunny-sprites.png'), bunnyPng);
  console.log(`✓ shield-bunny-sprites.png (${bunnyPng.length} bytes, 2048x128)`);

  console.log('All pet sprite sheets successfully generated!');
}

// Allow CLI execution: node generate_pet_sprites.js [optional_output_dir]
if (require.main === module) {
  const targetDir = process.argv[2] || path.join(__dirname, 'output');
  generateAllPetSprites(targetDir);
}

module.exports = {
  renderCipherCat,
  renderByteDog,
  renderShieldBunny,
  generateAllPetSprites,
  FRAME_SIZE,
  NUM_FRAMES,
  SHEET_WIDTH,
  SHEET_HEIGHT,
};

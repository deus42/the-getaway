import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import {
  type CharacterSpriteDirection,
  type CharacterSpriteManifestEntry,
  type CharacterSpriteSheetMetrics,
  type CharacterSpriteState,
  CHARACTER_SPRITE_DIRECTIONS,
  CHARACTER_SPRITE_MANIFEST,
  CHARACTER_SPRITE_STATES,
} from '../src/content/characters/spriteManifest';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');
const CHARACTER_OUTPUT_DIR = path.join(ROOT_DIR, 'public', 'characters');
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const crcTable = new Uint32Array(256).map((_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = (crc & 1) === 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

const crc32 = (buffer: Buffer): number => {
  let crc = 0xffffffff;
  for (let index = 0; index < buffer.length; index += 1) {
    crc = crcTable[(crc ^ buffer[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const writeChunk = (type: string, data: Buffer): Buffer => {
  const typeBuffer = Buffer.from(type, 'ascii');
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(data.length, 0);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
};

const createPng = (width: number, height: number, rgba: Uint8Array): Buffer => {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);

  for (let row = 0; row < height; row += 1) {
    const rawOffset = row * (stride + 1);
    raw[rawOffset] = 0;
    Buffer.from(rgba.buffer, row * stride, stride).copy(raw, rawOffset + 1);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    PNG_SIGNATURE,
    writeChunk('IHDR', ihdr),
    writeChunk('IDAT', zlib.deflateSync(raw)),
    writeChunk('IEND', Buffer.alloc(0)),
  ]);
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const colorToRgba = (hex: number, alpha = 255): [number, number, number, number] => [
  (hex >> 16) & 0xff,
  (hex >> 8) & 0xff,
  hex & 0xff,
  alpha,
];

const shiftColor = (hex: number, amount: number): number => {
  const apply = (channel: number): number => clamp(Math.round(channel + amount * 255), 0, 255);
  const red = apply((hex >> 16) & 0xff);
  const green = apply((hex >> 8) & 0xff);
  const blue = apply(hex & 0xff);
  return (red << 16) | (green << 8) | blue;
};

const setPixel = (
  pixels: Uint8Array,
  canvasWidth: number,
  canvasHeight: number,
  x: number,
  y: number,
  color: [number, number, number, number]
): void => {
  if (x < 0 || y < 0 || x >= canvasWidth || y >= canvasHeight) {
    return;
  }

  const offset = (y * canvasWidth + x) * 4;
  pixels[offset] = color[0];
  pixels[offset + 1] = color[1];
  pixels[offset + 2] = color[2];
  pixels[offset + 3] = color[3];
};

const fillRect = (
  pixels: Uint8Array,
  canvasWidth: number,
  canvasHeight: number,
  x: number,
  y: number,
  width: number,
  height: number,
  color: [number, number, number, number]
): void => {
  for (let row = y; row < y + height; row += 1) {
    for (let column = x; column < x + width; column += 1) {
      setPixel(pixels, canvasWidth, canvasHeight, column, row, color);
    }
  }
};

const fillEllipse = (
  pixels: Uint8Array,
  canvasWidth: number,
  canvasHeight: number,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  color: [number, number, number, number]
): void => {
  for (let row = -radiusY; row <= radiusY; row += 1) {
    for (let column = -radiusX; column <= radiusX; column += 1) {
      const ellipseX = column / Math.max(1, radiusX);
      const ellipseY = row / Math.max(1, radiusY);
      if (ellipseX * ellipseX + ellipseY * ellipseY <= 1) {
        setPixel(pixels, canvasWidth, canvasHeight, centerX + column, centerY + row, color);
      }
    }
  }
};

const DIRECTION_SHIFT: Record<CharacterSpriteDirection, { x: number; y: number }> = {
  north: { x: 0, y: -2 },
  'north-east': { x: 2, y: -1 },
  east: { x: 3, y: 0 },
  'south-east': { x: 2, y: 1 },
  south: { x: 0, y: 2 },
  'south-west': { x: -2, y: 1 },
  west: { x: -3, y: 0 },
  'north-west': { x: -2, y: -1 },
};

const STATE_FRAME_SHIFT: Record<CharacterSpriteState, number[]> = {
  idle: [0, 0, -1, 0],
  move: [-2, 1, -1, 2],
  attack: [1, 3, 1, -1],
  interact: [0, 1, 0, 1],
};

const STATE_ARM_SHIFT: Record<CharacterSpriteState, number[]> = {
  idle: [0, 0, 0, 0],
  move: [-2, 2, -1, 1],
  attack: [3, 5, 2, 0],
  interact: [1, 2, 1, 2],
};

const buildMetrics = (entry: CharacterSpriteManifestEntry): CharacterSpriteSheetMetrics => {
  const anchorY = Math.round(entry.frameSize.height * entry.origin.y);
  const states = {} as CharacterSpriteSheetMetrics['states'];

  CHARACTER_SPRITE_STATES.forEach((state) => {
    states[state] = {} as CharacterSpriteSheetMetrics['states'][CharacterSpriteState];
    CHARACTER_SPRITE_DIRECTIONS.forEach((direction) => {
      const frameOffsets = STATE_FRAME_SHIFT[state].map((offset) => anchorY + Math.round(offset * 0.4));
      states[state][direction] = {
        frameFootAnchorsPx: frameOffsets,
      };
    });
  });

  return {
    frameWidth: entry.frameSize.width,
    frameHeight: entry.frameSize.height,
    origin: {
      x: entry.origin.x,
      y: entry.origin.y,
    },
    footAnchorTolerancePx: entry.footAnchorTolerancePx,
    states,
  };
};

const drawSpriteFrame = (
  pixels: Uint8Array,
  sheetWidth: number,
  sheetHeight: number,
  entry: CharacterSpriteManifestEntry,
  state: CharacterSpriteState,
  direction: CharacterSpriteDirection,
  frameIndex: number
): void => {
  const frameX = frameIndex * entry.frameSize.width;
  const palette = entry.fallbackPalette ?? {};
  const accent = palette.accentColor ?? 0x38bdf8;
  const glow = palette.glowColor ?? shiftColor(accent, 0.18);
  const shadow = palette.shadowColor ?? 0x0f172a;
  const body = shiftColor(accent, -0.2);
  const coat = shiftColor(accent, -0.08);
  const skin = 0xd6b08c;
  const frameShift = STATE_FRAME_SHIFT[state][frameIndex];
  const armShift = STATE_ARM_SHIFT[state][frameIndex];
  const directionShift = DIRECTION_SHIFT[direction];
  const centerX = frameX + Math.floor(entry.frameSize.width / 2) + directionShift.x;
  const footY = Math.round(entry.frameSize.height * entry.origin.y) + directionShift.y;
  const bodyBottom = footY - 4 + frameShift;
  const headCenterY = bodyBottom - 29;

  fillEllipse(
    pixels,
    sheetWidth,
    sheetHeight,
    centerX,
    footY + 2,
    11,
    4,
    colorToRgba(shadow, 92)
  );

  fillRect(
    pixels,
    sheetWidth,
    sheetHeight,
    centerX - 5,
    bodyBottom - 22,
    10,
    18,
    colorToRgba(coat, 255)
  );
  fillRect(
    pixels,
    sheetWidth,
    sheetHeight,
    centerX - 7,
    bodyBottom - 16,
    3,
    14,
    colorToRgba(body, 255)
  );
  fillRect(
    pixels,
    sheetWidth,
    sheetHeight,
    centerX + 4,
    bodyBottom - 16 - armShift,
    3,
    14 + armShift,
    colorToRgba(body, 255)
  );
  fillRect(
    pixels,
    sheetWidth,
    sheetHeight,
    centerX - 4,
    bodyBottom - 4,
    3,
    10,
    colorToRgba(shadow, 255)
  );
  fillRect(
    pixels,
    sheetWidth,
    sheetHeight,
    centerX + 1,
    bodyBottom - 5 - Math.round(frameShift * 0.35),
    3,
    11 + Math.round(frameShift * 0.35),
    colorToRgba(shadow, 255)
  );
  fillEllipse(
    pixels,
    sheetWidth,
    sheetHeight,
    centerX,
    headCenterY,
    6,
    7,
    colorToRgba(skin, 255)
  );
  fillRect(
    pixels,
    sheetWidth,
    sheetHeight,
    centerX - 6,
    headCenterY - 11,
    12,
    4,
    colorToRgba(glow, 255)
  );
  fillRect(
    pixels,
    sheetWidth,
    sheetHeight,
    centerX - 1,
    bodyBottom - 18,
    2,
    12,
    colorToRgba(glow, 255)
  );
};

const createSheet = (
  entry: CharacterSpriteManifestEntry,
  state: CharacterSpriteState,
  direction: CharacterSpriteDirection
): Buffer => {
  const width = entry.frameSize.width * entry.frameCount;
  const height = entry.frameSize.height;
  const pixels = new Uint8Array(width * height * 4);

  for (let frameIndex = 0; frameIndex < entry.frameCount; frameIndex += 1) {
    drawSpriteFrame(pixels, width, height, entry, state, direction, frameIndex);
  }

  return createPng(width, height, pixels);
};

const ensureDirectory = async (targetPath: string): Promise<void> => {
  await fs.mkdir(targetPath, { recursive: true });
};

const writeEntry = async (entry: CharacterSpriteManifestEntry): Promise<void> => {
  const outputDir = path.join(CHARACTER_OUTPUT_DIR, entry.spriteSetId);
  await ensureDirectory(outputDir);

  const metrics = buildMetrics(entry);
  await fs.writeFile(
    path.join(outputDir, 'sheet-metrics.json'),
    `${JSON.stringify(metrics, null, 2)}\n`,
    'utf8'
  );

  await Promise.all(
    CHARACTER_SPRITE_STATES.flatMap((state) =>
      CHARACTER_SPRITE_DIRECTIONS.map(async (direction) => {
        await fs.writeFile(
          path.join(outputDir, `${state}-${direction}.png`),
          createSheet(entry, state, direction)
        );
      })
    )
  );
};

const main = async (): Promise<void> => {
  await ensureDirectory(CHARACTER_OUTPUT_DIR);
  for (const entry of CHARACTER_SPRITE_MANIFEST) {
    await writeEntry(entry);
  }

  console.log(
    `[sprites] Generated ${CHARACTER_SPRITE_MANIFEST.length} placeholder sprite sets in ${CHARACTER_OUTPUT_DIR}`
  );
};

void main();

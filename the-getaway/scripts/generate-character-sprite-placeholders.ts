import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import {
  type CharacterSpriteDirection,
  type CharacterSpriteManifestEntry,
  type CharacterSpritePalette,
  type CharacterSpriteSheetMetrics,
  type CharacterSpriteState,
  CHARACTER_SPRITE_DIRECTIONS,
  CHARACTER_SPRITE_MANIFEST,
  CHARACTER_SPRITE_STATES,
} from '../src/content/characters/spriteManifest';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');
const CHARACTER_OUTPUT_DIR = path.join(ROOT_DIR, 'public', 'characters');
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

type CharacterSilhouette = 'slim' | 'athletic' | 'stocky';
type HairStyle = 'short' | 'bob' | 'bun' | 'mohawk' | 'braid' | 'crest' | 'shaved';
type HeadwearStyle = 'none' | 'visor' | 'hood' | 'cap' | 'crown' | 'band';
type AccessoryStyle =
  | 'none'
  | 'satchel'
  | 'cape'
  | 'scarf'
  | 'pauldron'
  | 'medkit'
  | 'holster'
  | 'drone'
  | 'badge';
type CoatHemStyle = 'short' | 'long' | 'split';

interface CharacterSpriteStyleProfile {
  silhouette: CharacterSilhouette;
  hairStyle: HairStyle;
  headwear: HeadwearStyle;
  accessory: AccessoryStyle;
  coatHem: CoatHemStyle;
  skinColor: number;
  hairColor: number;
  clothingPrimary: number;
  clothingSecondary: number;
  trimColor: number;
  trouserColor: number;
  bootColor: number;
  accessoryColor: number;
  auraColor: number;
}

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

const mixColors = (from: number, to: number, t: number): number => {
  const fromRed = (from >> 16) & 0xff;
  const fromGreen = (from >> 8) & 0xff;
  const fromBlue = from & 0xff;
  const toRed = (to >> 16) & 0xff;
  const toGreen = (to >> 8) & 0xff;
  const toBlue = to & 0xff;

  const red = Math.round(fromRed + (toRed - fromRed) * t);
  const green = Math.round(fromGreen + (toGreen - fromGreen) * t);
  const blue = Math.round(fromBlue + (toBlue - fromBlue) * t);
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

const fillRectOutlined = (
  pixels: Uint8Array,
  canvasWidth: number,
  canvasHeight: number,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: [number, number, number, number],
  outline: [number, number, number, number]
): void => {
  fillRect(pixels, canvasWidth, canvasHeight, x - 1, y - 1, width + 2, height + 2, outline);
  fillRect(pixels, canvasWidth, canvasHeight, x, y, width, height, fill);
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

const fillEllipseOutlined = (
  pixels: Uint8Array,
  canvasWidth: number,
  canvasHeight: number,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  fill: [number, number, number, number],
  outline: [number, number, number, number]
): void => {
  fillEllipse(
    pixels,
    canvasWidth,
    canvasHeight,
    centerX,
    centerY,
    radiusX + 1,
    radiusY + 1,
    outline
  );
  fillEllipse(pixels, canvasWidth, canvasHeight, centerX, centerY, radiusX, radiusY, fill);
};

const fillDitherRect = (
  pixels: Uint8Array,
  canvasWidth: number,
  canvasHeight: number,
  x: number,
  y: number,
  width: number,
  height: number,
  color: [number, number, number, number],
  phase = 0
): void => {
  for (let row = 0; row < height; row += 1) {
    for (let column = 0; column < width; column += 1) {
      if ((row + column + phase) % 2 === 0) {
        setPixel(pixels, canvasWidth, canvasHeight, x + column, y + row, color);
      }
    }
  }
};

const drawVerticalGlow = (
  pixels: Uint8Array,
  canvasWidth: number,
  canvasHeight: number,
  x: number,
  y: number,
  height: number,
  color: [number, number, number, number]
): void => {
  for (let row = 0; row < height; row += 1) {
    if (row % 3 !== 1) {
      setPixel(pixels, canvasWidth, canvasHeight, x, y + row, color);
    }
  }
};

const STYLE_PROFILES: Record<string, CharacterSpriteStyleProfile> = {
  hero_operative: {
    silhouette: 'athletic',
    hairStyle: 'short',
    headwear: 'visor',
    accessory: 'holster',
    coatHem: 'split',
    skinColor: 0xca9b74,
    hairColor: 0x0f172a,
    clothingPrimary: 0x1d4f7a,
    clothingSecondary: 0x0b2740,
    trimColor: 0x6fe5ff,
    trouserColor: 0x132236,
    bootColor: 0x070d18,
    accessoryColor: 0x94a3b8,
    auraColor: 0x67e8f9,
  },
  hero_survivor: {
    silhouette: 'athletic',
    hairStyle: 'bun',
    headwear: 'band',
    accessory: 'scarf',
    coatHem: 'long',
    skinColor: 0xd2a37f,
    hairColor: 0x6b341d,
    clothingPrimary: 0x7c311d,
    clothingSecondary: 0x4a190d,
    trimColor: 0xf2b14b,
    trouserColor: 0x3f2a1f,
    bootColor: 0x241712,
    accessoryColor: 0xf6c56d,
    auraColor: 0xfb923c,
  },
  hero_tech: {
    silhouette: 'slim',
    hairStyle: 'shaved',
    headwear: 'visor',
    accessory: 'drone',
    coatHem: 'short',
    skinColor: 0xc89468,
    hairColor: 0x111827,
    clothingPrimary: 0x155e3c,
    clothingSecondary: 0x0b3822,
    trimColor: 0x6af5a5,
    trouserColor: 0x132a22,
    bootColor: 0x09150f,
    accessoryColor: 0x9ae6b4,
    auraColor: 0x4ade80,
  },
  hero_scavenger: {
    silhouette: 'stocky',
    hairStyle: 'braid',
    headwear: 'hood',
    accessory: 'satchel',
    coatHem: 'long',
    skinColor: 0xb9825f,
    hairColor: 0x3f2a1d,
    clothingPrimary: 0x7a5a14,
    clothingSecondary: 0x463208,
    trimColor: 0xf7dd72,
    trouserColor: 0x352913,
    bootColor: 0x1a1209,
    accessoryColor: 0xc4892e,
    auraColor: 0xfacc15,
  },
  npc_lira_vendor: {
    silhouette: 'slim',
    hairStyle: 'bob',
    headwear: 'none',
    accessory: 'scarf',
    coatHem: 'short',
    skinColor: 0xe0b794,
    hairColor: 0x3d1020,
    clothingPrimary: 0x95416d,
    clothingSecondary: 0x5d1e42,
    trimColor: 0xffb1d1,
    trouserColor: 0x3a1d31,
    bootColor: 0x190b14,
    accessoryColor: 0xf8a5c7,
    auraColor: 0xf9a8d4,
  },
  npc_archivist_naila: {
    silhouette: 'slim',
    hairStyle: 'bun',
    headwear: 'none',
    accessory: 'cape',
    coatHem: 'long',
    skinColor: 0xdcb18a,
    hairColor: 0x2d2238,
    clothingPrimary: 0x38548d,
    clothingSecondary: 0x1e2e57,
    trimColor: 0xbad0ff,
    trouserColor: 0x22304e,
    bootColor: 0x11182a,
    accessoryColor: 0xd7e4ff,
    auraColor: 0x93c5fd,
  },
  npc_courier_brant: {
    silhouette: 'athletic',
    hairStyle: 'short',
    headwear: 'cap',
    accessory: 'satchel',
    coatHem: 'short',
    skinColor: 0xc89064,
    hairColor: 0x3a1e12,
    clothingPrimary: 0x8c5316,
    clothingSecondary: 0x57330f,
    trimColor: 0xf6ca66,
    trouserColor: 0x322418,
    bootColor: 0x18100c,
    accessoryColor: 0xb37d40,
    auraColor: 0xfbbf24,
  },
  npc_firebrand_juno: {
    silhouette: 'athletic',
    hairStyle: 'mohawk',
    headwear: 'band',
    accessory: 'pauldron',
    coatHem: 'split',
    skinColor: 0xbe8766,
    hairColor: 0x2a0707,
    clothingPrimary: 0x981b1f,
    clothingSecondary: 0x5c0f15,
    trimColor: 0xff9a7d,
    trouserColor: 0x3b171a,
    bootColor: 0x1e0a0c,
    accessoryColor: 0x6f7e8f,
    auraColor: 0xf87171,
  },
  npc_seraph_warden: {
    silhouette: 'stocky',
    hairStyle: 'crest',
    headwear: 'crown',
    accessory: 'cape',
    coatHem: 'long',
    skinColor: 0xd4ae8f,
    hairColor: 0x271044,
    clothingPrimary: 0x5b3f9a,
    clothingSecondary: 0x35235f,
    trimColor: 0xd7c7ff,
    trouserColor: 0x271e3c,
    bootColor: 0x120d1d,
    accessoryColor: 0xd5d8e8,
    auraColor: 0xc4b5fd,
  },
  npc_drone_handler_kesh: {
    silhouette: 'slim',
    hairStyle: 'shaved',
    headwear: 'visor',
    accessory: 'drone',
    coatHem: 'short',
    skinColor: 0xbf8966,
    hairColor: 0x162022,
    clothingPrimary: 0x12655e,
    clothingSecondary: 0x0a3f3a,
    trimColor: 0x8ff7ec,
    trouserColor: 0x173537,
    bootColor: 0x0b1718,
    accessoryColor: 0x9febe6,
    auraColor: 0x2dd4bf,
  },
  npc_medic_yara: {
    silhouette: 'slim',
    hairStyle: 'braid',
    headwear: 'band',
    accessory: 'medkit',
    coatHem: 'short',
    skinColor: 0xdbb390,
    hairColor: 0x493024,
    clothingPrimary: 0x1b765f,
    clothingSecondary: 0x0f4a3c,
    trimColor: 0xaaf3d0,
    trouserColor: 0x1f3d32,
    bootColor: 0x0f1e18,
    accessoryColor: 0xe6f7f2,
    auraColor: 0x34d399,
  },
  npc_captain_reyna: {
    silhouette: 'athletic',
    hairStyle: 'short',
    headwear: 'cap',
    accessory: 'badge',
    coatHem: 'long',
    skinColor: 0xd7ab85,
    hairColor: 0x42131f,
    clothingPrimary: 0x8d1737,
    clothingSecondary: 0x510d23,
    trimColor: 0xff9db0,
    trouserColor: 0x341724,
    bootColor: 0x1b0a10,
    accessoryColor: 0xf2d3a2,
    auraColor: 0xfb7185,
  },
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

const STATE_BODY_SHIFT: Record<CharacterSpriteState, number[]> = {
  idle: [0, 1, 0, 1],
  move: [-1, 1, -2, 1],
  attack: [0, -1, 1, 0],
  interact: [0, 1, 0, 1],
};

const STATE_ARM_SWING: Record<CharacterSpriteState, number[]> = {
  idle: [0, 0, 1, 0],
  move: [-3, 2, -2, 3],
  attack: [4, 6, 2, 0],
  interact: [2, 3, 2, 3],
};

const STATE_LEG_SWING: Record<CharacterSpriteState, number[]> = {
  idle: [0, 0, 0, 0],
  move: [-3, 2, -2, 3],
  attack: [-1, -1, 0, 0],
  interact: [0, 1, 0, 1],
};

const silhouetteMetrics = (
  silhouette: CharacterSilhouette
): {
  shoulderWidth: number;
  torsoWidth: number;
  hipWidth: number;
  armLength: number;
  legHeight: number;
  headRadiusX: number;
  headRadiusY: number;
} => {
  switch (silhouette) {
    case 'slim':
      return {
        shoulderWidth: 12,
        torsoWidth: 9,
        hipWidth: 10,
        armLength: 12,
        legHeight: 13,
        headRadiusX: 6,
        headRadiusY: 7,
      };
    case 'stocky':
      return {
        shoulderWidth: 16,
        torsoWidth: 13,
        hipWidth: 14,
        armLength: 11,
        legHeight: 12,
        headRadiusX: 7,
        headRadiusY: 8,
      };
    case 'athletic':
    default:
      return {
        shoulderWidth: 14,
        torsoWidth: 11,
        hipWidth: 12,
        armLength: 12,
        legHeight: 13,
        headRadiusX: 6,
        headRadiusY: 7,
      };
  }
};

const defaultStyleProfile = (palette: CharacterSpritePalette | undefined): CharacterSpriteStyleProfile => {
  const accent = palette?.accentColor ?? 0x38bdf8;
  const glow = palette?.glowColor ?? shiftColor(accent, 0.2);
  const shadow = palette?.shadowColor ?? 0x0f172a;
  return {
    silhouette: 'athletic',
    hairStyle: 'short',
    headwear: 'none',
    accessory: 'none',
    coatHem: 'split',
    skinColor: 0xce9b78,
    hairColor: shiftColor(shadow, 0.08),
    clothingPrimary: shiftColor(accent, -0.25),
    clothingSecondary: shiftColor(accent, -0.42),
    trimColor: glow,
    trouserColor: mixColors(shadow, accent, 0.15),
    bootColor: shiftColor(shadow, -0.1),
    accessoryColor: shiftColor(glow, -0.08),
    auraColor: glow,
  };
};

const buildMetrics = (entry: CharacterSpriteManifestEntry): CharacterSpriteSheetMetrics => {
  const anchorY = Math.round(entry.frameSize.height * entry.origin.y);
  const states = {} as CharacterSpriteSheetMetrics['states'];

  CHARACTER_SPRITE_STATES.forEach((state) => {
    states[state] = {} as CharacterSpriteSheetMetrics['states'][CharacterSpriteState];
    CHARACTER_SPRITE_DIRECTIONS.forEach((direction) => {
      const frameOffsets = STATE_BODY_SHIFT[state].map((offset) => anchorY + Math.round(offset * 0.4));
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

const drawHair = (
  pixels: Uint8Array,
  sheetWidth: number,
  sheetHeight: number,
  centerX: number,
  headCenterY: number,
  profile: CharacterSpriteStyleProfile,
  outline: [number, number, number, number]
): void => {
  const hair = colorToRgba(profile.hairColor, 255);
  switch (profile.hairStyle) {
    case 'bob':
      fillRectOutlined(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX - 6,
        headCenterY - 9,
        12,
        5,
        hair,
        outline
      );
      fillRectOutlined(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX - 7,
        headCenterY - 3,
        3,
        5,
        hair,
        outline
      );
      fillRectOutlined(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX + 4,
        headCenterY - 3,
        3,
        5,
        hair,
        outline
      );
      break;
    case 'bun':
      fillRectOutlined(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX - 6,
        headCenterY - 10,
        12,
        4,
        hair,
        outline
      );
      fillEllipseOutlined(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX + 2,
        headCenterY - 10,
        3,
        3,
        hair,
        outline
      );
      break;
    case 'mohawk':
      fillRectOutlined(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX - 2,
        headCenterY - 13,
        4,
        7,
        hair,
        outline
      );
      break;
    case 'braid':
      fillRectOutlined(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX - 6,
        headCenterY - 10,
        12,
        4,
        hair,
        outline
      );
      fillRectOutlined(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX + 5,
        headCenterY + 1,
        2,
        6,
        hair,
        outline
      );
      break;
    case 'crest':
      fillRectOutlined(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX - 1,
        headCenterY - 13,
        2,
        8,
        hair,
        outline
      );
      fillRectOutlined(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX - 4,
        headCenterY - 10,
        8,
        2,
        hair,
        outline
      );
      break;
    case 'shaved':
      fillRectOutlined(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX - 5,
        headCenterY - 10,
        10,
        2,
        colorToRgba(shiftColor(profile.skinColor, -0.1), 255),
        outline
      );
      break;
    case 'short':
    default:
      fillRectOutlined(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX - 6,
        headCenterY - 10,
        12,
        4,
        hair,
        outline
      );
      break;
  }
};

const drawHeadwear = (
  pixels: Uint8Array,
  sheetWidth: number,
  sheetHeight: number,
  centerX: number,
  headCenterY: number,
  profile: CharacterSpriteStyleProfile,
  outline: [number, number, number, number]
): void => {
  const trim = colorToRgba(profile.trimColor, 255);
  const cloth = colorToRgba(profile.clothingSecondary, 255);
  switch (profile.headwear) {
    case 'visor':
      fillRectOutlined(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX - 6,
        headCenterY - 2,
        12,
        2,
        trim,
        outline
      );
      break;
    case 'hood':
      fillEllipseOutlined(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX,
        headCenterY - 1,
        9,
        10,
        cloth,
        outline
      );
      fillEllipse(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX,
        headCenterY + 1,
        6,
        7,
        colorToRgba(profile.skinColor, 255)
      );
      break;
    case 'cap':
      fillRectOutlined(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX - 6,
        headCenterY - 10,
        12,
        4,
        cloth,
        outline
      );
      fillRectOutlined(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX - 7,
        headCenterY - 6,
        14,
        2,
        trim,
        outline
      );
      break;
    case 'crown':
      fillRectOutlined(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX - 6,
        headCenterY - 11,
        12,
        2,
        trim,
        outline
      );
      fillRectOutlined(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX - 5,
        headCenterY - 14,
        2,
        3,
        trim,
        outline
      );
      fillRectOutlined(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX - 1,
        headCenterY - 15,
        2,
        4,
        trim,
        outline
      );
      fillRectOutlined(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX + 3,
        headCenterY - 14,
        2,
        3,
        trim,
        outline
      );
      break;
    case 'band':
      fillRectOutlined(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX - 6,
        headCenterY - 4,
        12,
        2,
        trim,
        outline
      );
      break;
    case 'none':
    default:
      break;
  }
};

const drawAccessory = (
  pixels: Uint8Array,
  sheetWidth: number,
  sheetHeight: number,
  centerX: number,
  coatTop: number,
  bodyBottom: number,
  profile: CharacterSpriteStyleProfile,
  outline: [number, number, number, number],
  horizontalFacing: number,
  state: CharacterSpriteState,
  frameIndex: number
): void => {
  const accent = colorToRgba(profile.accessoryColor, 255);
  const trim = colorToRgba(profile.trimColor, 255);
  const cloth = colorToRgba(profile.clothingSecondary, 255);
  const accessorySide = horizontalFacing === 0 ? 1 : horizontalFacing;

  switch (profile.accessory) {
    case 'satchel':
      drawVerticalGlow(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX + accessorySide * 2,
        coatTop + 4,
        15,
        trim
      );
      fillRectOutlined(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX + accessorySide * 4 - 3,
        bodyBottom - 14,
        6,
        6,
        accent,
        outline
      );
      break;
    case 'cape':
      fillRectOutlined(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX - 8,
        coatTop + 1,
        5,
        bodyBottom - coatTop - 1,
        cloth,
        outline
      );
      break;
    case 'scarf':
      fillRectOutlined(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX - 7,
        coatTop + 2,
        14,
        3,
        accent,
        outline
      );
      fillRectOutlined(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX + accessorySide * 4,
        coatTop + 5,
        2,
        8 + (state === 'move' ? Math.abs(STATE_ARM_SWING[state][frameIndex]) : 0),
        accent,
        outline
      );
      break;
    case 'pauldron':
      fillRectOutlined(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX + accessorySide * 4 - 4,
        coatTop,
        8,
        4,
        accent,
        outline
      );
      break;
    case 'medkit':
      fillRectOutlined(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX + accessorySide * 4 - 3,
        bodyBottom - 15,
        6,
        6,
        colorToRgba(0xe6f7f2, 255),
        outline
      );
      fillRect(pixels, sheetWidth, sheetHeight, centerX + accessorySide * 4 - 1, bodyBottom - 14, 2, 4, trim);
      fillRect(pixels, sheetWidth, sheetHeight, centerX + accessorySide * 4 - 2, bodyBottom - 13, 4, 2, trim);
      break;
    case 'holster':
      fillRectOutlined(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX + accessorySide * 3 - 2,
        bodyBottom - 12,
        4,
        7,
        cloth,
        outline
      );
      break;
    case 'drone':
      fillEllipseOutlined(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX + accessorySide * 9,
        coatTop + 4 + (state === 'interact' ? -1 : 0),
        3,
        3,
        accent,
        outline
      );
      setPixel(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX + accessorySide * 9,
        coatTop + 4 + (state === 'interact' ? -1 : 0),
        trim
      );
      break;
    case 'badge':
      fillRectOutlined(
        pixels,
        sheetWidth,
        sheetHeight,
        centerX + 2,
        coatTop + 8,
        3,
        3,
        accent,
        outline
      );
      break;
    case 'none':
    default:
      break;
  }
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
  const style = STYLE_PROFILES[entry.spriteSetId] ?? defaultStyleProfile(entry.fallbackPalette);
  const metrics = silhouetteMetrics(style.silhouette);
  const directionShift = DIRECTION_SHIFT[direction];
  const horizontalFacing = direction.includes('east') ? 1 : direction.includes('west') ? -1 : 0;
  const verticalFacing = direction.startsWith('north') ? -1 : 1;
  const bodyShift = STATE_BODY_SHIFT[state][frameIndex];
  const armSwing = STATE_ARM_SWING[state][frameIndex];
  const legSwing = STATE_LEG_SWING[state][frameIndex];
  const centerX = frameX + Math.floor(entry.frameSize.width / 2) + directionShift.x;
  const footY = Math.round(entry.frameSize.height * entry.origin.y) + directionShift.y;
  const bodyBottom = footY - 5 + bodyShift;
  const coatTop = bodyBottom - 29 + Math.round(verticalFacing * 0.4);
  const headCenterY = coatTop - 1;

  const outline = colorToRgba(mixColors(style.bootColor, 0x000000, 0.35), 255);
  const shadow = colorToRgba(shiftColor(style.bootColor, -0.05), 220);
  const aura = colorToRgba(style.auraColor, state === 'attack' ? 84 : 54);
  const coatPrimary = colorToRgba(style.clothingPrimary, 255);
  const coatSecondary = colorToRgba(style.clothingSecondary, 255);
  const trim = colorToRgba(style.trimColor, 255);
  const trouser = colorToRgba(style.trouserColor, 255);
  const boots = colorToRgba(style.bootColor, 255);
  const skin = colorToRgba(style.skinColor, 255);

  fillEllipse(
    pixels,
    sheetWidth,
    sheetHeight,
    centerX,
    footY + 2,
    12,
    4,
    shadow
  );
  fillEllipse(
    pixels,
    sheetWidth,
    sheetHeight,
    centerX,
    footY + 1,
    8,
    2,
    colorToRgba(style.auraColor, 42)
  );
  fillEllipse(
    pixels,
    sheetWidth,
    sheetHeight,
    centerX,
    coatTop + 18,
    11,
    19,
    aura
  );

  drawAccessory(
    pixels,
    sheetWidth,
    sheetHeight,
    centerX,
    coatTop,
    bodyBottom,
    style,
    outline,
    horizontalFacing,
    state,
    frameIndex
  );

  const leftLegHeight = metrics.legHeight + Math.max(0, -legSwing);
  const rightLegHeight = metrics.legHeight + Math.max(0, legSwing);
  fillRectOutlined(
    pixels,
    sheetWidth,
    sheetHeight,
    centerX - 5,
    bodyBottom - leftLegHeight,
    4,
    leftLegHeight,
    trouser,
    outline
  );
  fillRectOutlined(
    pixels,
    sheetWidth,
    sheetHeight,
    centerX + 1,
    bodyBottom - rightLegHeight,
    4,
    rightLegHeight,
    trouser,
    outline
  );
  fillRectOutlined(
    pixels,
    sheetWidth,
    sheetHeight,
    centerX - 6,
    bodyBottom + 1,
    5,
    3,
    boots,
    outline
  );
  fillRectOutlined(
    pixels,
    sheetWidth,
    sheetHeight,
    centerX + 1,
    bodyBottom + 1,
    5,
    3,
    boots,
    outline
  );

  fillRectOutlined(
    pixels,
    sheetWidth,
    sheetHeight,
    centerX - Math.floor(metrics.shoulderWidth / 2),
    coatTop,
    metrics.shoulderWidth,
    7,
    coatPrimary,
    outline
  );
  fillRectOutlined(
    pixels,
    sheetWidth,
    sheetHeight,
    centerX - Math.floor(metrics.torsoWidth / 2),
    coatTop + 6,
    metrics.torsoWidth,
    12,
    coatPrimary,
    outline
  );
  fillRectOutlined(
    pixels,
    sheetWidth,
    sheetHeight,
    centerX - Math.floor(metrics.hipWidth / 2),
    coatTop + 18,
    metrics.hipWidth,
    5,
    coatSecondary,
    outline
  );

  if (style.coatHem === 'long') {
    fillRectOutlined(
      pixels,
      sheetWidth,
      sheetHeight,
      centerX - 5,
      coatTop + 22,
      4,
      9,
      coatSecondary,
      outline
    );
    fillRectOutlined(
      pixels,
      sheetWidth,
      sheetHeight,
      centerX + 1,
      coatTop + 22,
      4,
      9,
      coatSecondary,
      outline
    );
  } else if (style.coatHem === 'split') {
    fillRectOutlined(
      pixels,
      sheetWidth,
      sheetHeight,
      centerX - 6,
      coatTop + 22,
      4,
      7,
      coatSecondary,
      outline
    );
    fillRectOutlined(
      pixels,
      sheetWidth,
      sheetHeight,
      centerX + 2,
      coatTop + 22,
      4,
      7,
      coatSecondary,
      outline
    );
  } else {
    fillRectOutlined(
      pixels,
      sheetWidth,
      sheetHeight,
      centerX - 4,
      coatTop + 22,
      8,
      5,
      coatSecondary,
      outline
    );
  }

  fillRect(pixels, sheetWidth, sheetHeight, centerX - 6, coatTop + 11, 12, 2, trim);
  fillRect(pixels, sheetWidth, sheetHeight, centerX - 1, coatTop + 6, 2, 17, trim);
  fillDitherRect(
    pixels,
    sheetWidth,
    sheetHeight,
    centerX - Math.floor(metrics.torsoWidth / 2),
    coatTop + 6,
    metrics.torsoWidth,
    12,
    colorToRgba(shiftColor(style.clothingPrimary, 0.14), 180),
    frameIndex
  );

  const leftArmLength = metrics.armLength + Math.max(0, -armSwing);
  const rightArmLength = metrics.armLength + Math.max(0, armSwing);
  fillRectOutlined(
    pixels,
    sheetWidth,
    sheetHeight,
    centerX - Math.floor(metrics.shoulderWidth / 2) - 3,
    coatTop + 5,
    3,
    leftArmLength,
    coatPrimary,
    outline
  );
  fillRectOutlined(
    pixels,
    sheetWidth,
    sheetHeight,
    centerX + Math.floor(metrics.shoulderWidth / 2),
    coatTop + 5 - Math.max(0, armSwing),
    3,
    rightArmLength + Math.max(0, armSwing),
    coatPrimary,
    outline
  );

  fillRectOutlined(
    pixels,
    sheetWidth,
    sheetHeight,
    centerX - 1,
    coatTop - 1,
    2,
    4,
    skin,
    outline
  );
  fillEllipseOutlined(
    pixels,
    sheetWidth,
    sheetHeight,
    centerX,
    headCenterY,
    metrics.headRadiusX,
    metrics.headRadiusY,
    skin,
    outline
  );

  drawHair(pixels, sheetWidth, sheetHeight, centerX, headCenterY, style, outline);
  drawHeadwear(pixels, sheetWidth, sheetHeight, centerX, headCenterY, style, outline);

  const eyeColor = colorToRgba(0x17212b, 255);
  if (horizontalFacing === 0) {
    setPixel(pixels, sheetWidth, sheetHeight, centerX - 2, headCenterY - 1, eyeColor);
    setPixel(pixels, sheetWidth, sheetHeight, centerX + 2, headCenterY - 1, eyeColor);
  } else {
    setPixel(
      pixels,
      sheetWidth,
      sheetHeight,
      centerX + horizontalFacing * 2,
      headCenterY - 1,
      eyeColor
    );
  }
  setPixel(
    pixels,
    sheetWidth,
    sheetHeight,
    centerX + horizontalFacing,
    headCenterY + 2,
    colorToRgba(shiftColor(style.skinColor, -0.18), 255)
  );

  fillRect(pixels, sheetWidth, sheetHeight, centerX - 5, coatTop + 3, 10, 1, trim);
  drawVerticalGlow(
    pixels,
    sheetWidth,
    sheetHeight,
    centerX + horizontalFacing * 6,
    coatTop + 6,
    12,
    colorToRgba(style.auraColor, 180)
  );

  if (state === 'attack') {
    fillRect(
      pixels,
      sheetWidth,
      sheetHeight,
      centerX + 7 + horizontalFacing * 2,
      coatTop + 8,
      6,
      2,
      colorToRgba(style.auraColor, 220)
    );
    fillRect(
      pixels,
      sheetWidth,
      sheetHeight,
      centerX + 9 + horizontalFacing * 2,
      coatTop + 6,
      2,
      6,
      colorToRgba(style.trimColor, 220)
    );
  }

  if (state === 'interact') {
    fillRectOutlined(
      pixels,
      sheetWidth,
      sheetHeight,
      centerX + 7,
      coatTop + 5,
      7,
      5,
      colorToRgba(style.auraColor, 130),
      colorToRgba(style.trimColor, 210)
    );
  }
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
    `[sprites] Generated ${CHARACTER_SPRITE_MANIFEST.length} beautified sprite sets in ${CHARACTER_OUTPUT_DIR}`
  );
};

void main();

import fs from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  CHARACTER_SPRITE_DIRECTIONS,
  CHARACTER_SPRITE_MANIFEST,
  CHARACTER_SPRITE_STATES,
  NON_WORLD_CHARACTER_PRESENTATIONS,
  type CharacterSpriteDirection,
  type CharacterSpriteFrameMetrics,
  type CharacterSpriteManifestEntry,
  type CharacterSpriteSheetMetrics,
  type CharacterSpriteState,
} from '../src/content/characters/spriteManifest';
import {
  encodeRgbaPng,
  decodeRgbaPng,
  extractRgbaRegion,
  measureAlpha,
  resizeRgbaBox,
  resizeRgbaBilinear,
  sha256Hex,
  type RgbaImage,
} from './lib/rgbaPng';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');
const REPOSITORY_ROOT = path.resolve(ROOT_DIR, '..');
const BUILD_MODE = process.argv.includes('--check') ? 'check' : process.argv.includes('--publish') ? 'publish' : null;
if (!BUILD_MODE || (process.argv.includes('--check') && process.argv.includes('--publish'))) {
  throw new Error('Use exactly one generation mode: --publish or --check');
}
const STAGING_ROOT = path.join(
  REPOSITORY_ROOT,
  'art',
  'actors',
  'get206',
  '.staging',
  `${process.pid}`
);
const STAGING_APP_ROOT = path.join(STAGING_ROOT, 'the-getaway');
const CHARACTER_OUTPUT_DIR = path.join(STAGING_APP_ROOT, 'public', 'characters');
const PORTRAIT_OUTPUT_DIR = path.join(STAGING_APP_ROOT, 'public', 'portraits', 'level0');
const PROOF_OUTPUT_DIR = path.join(STAGING_ROOT, 'art', 'actors', 'get206', 'proof');
const FINAL_CHARACTER_OUTPUT_DIR = path.join(ROOT_DIR, 'public', 'characters');
const FINAL_PORTRAIT_OUTPUT_DIR = path.join(ROOT_DIR, 'public', 'portraits', 'level0');
const FINAL_PROOF_OUTPUT_DIR = path.join(REPOSITORY_ROOT, 'art', 'actors', 'get206', 'proof');
const RECIPE_PATH = path.join(
  REPOSITORY_ROOT,
  'art',
  'actors',
  'get206',
  'manifests',
  'grounded-actor-recipe.json'
);
const INTEGRITY_TS_PATH = path.join(
  STAGING_APP_ROOT,
  'src',
  'content',
  'characters',
  'generatedActorAssetIntegrity.ts'
);
const FINAL_INTEGRITY_TS_PATH = path.join(
  ROOT_DIR,
  'src',
  'content',
  'characters',
  'generatedActorAssetIntegrity.ts'
);
const INTEGRITY_JSON_PATH = path.join(CHARACTER_OUTPUT_DIR, 'actor-asset-integrity.json');

type Rgba = readonly [number, number, number, number];
type HairStyle = 'crop' | 'short' | 'curls' | 'bun' | 'cap';
type Accessory =
  | 'messenger'
  | 'document-pouch'
  | 'medical-bag'
  | 'folio'
  | 'service-bag'
  | 'identity-scanner'
  | 'tablet'
  | 'toolbox'
  | 'delivery-bag'
  | 'none';

interface ActorStyleProfile {
  actorId: string;
  skin: number;
  hair: number;
  jacket: number;
  shirt: number;
  trousers: number;
  shoes: number;
  accent: number;
  hairStyle: HairStyle;
  accessory: Accessory;
  accessorySide: -1 | 1;
  bodyWidth: number;
  shoulderWidth: number;
  headWidth: number;
  jacketLength: number;
  heightOffset: number;
  portraitCrop: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface ActorRecipe {
  schemaVersion: 1;
  recipeId: string;
  spriteReference: { id: string; path: string; sha256: string };
  portraitReference: { id: string; path: string; sha256: string };
  renderContract: { supersample: number };
  actors: Record<string, Omit<ActorStyleProfile, 'actorId'>>;
}

const RECIPE = JSON.parse(readFileSync(RECIPE_PATH, 'utf8')) as ActorRecipe;
const SPRITE_REFERENCE_PATH = path.resolve(REPOSITORY_ROOT, RECIPE.spriteReference.path);
const PORTRAIT_REFERENCE_PATH = path.resolve(REPOSITORY_ROOT, RECIPE.portraitReference.path);
const ACTOR_RECIPE_ID = RECIPE.recipeId;
const SUPERSAMPLE = RECIPE.renderContract.supersample;
const PROFILES = Object.fromEntries(
  Object.entries(RECIPE.actors).map(([actorId, profile]) => [actorId, { actorId, ...profile }])
) as Record<string, ActorStyleProfile>;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const color = (hex: number, alpha = 255): Rgba => [
  (hex >> 16) & 0xff,
  (hex >> 8) & 0xff,
  hex & 0xff,
  alpha,
];

const shade = (hex: number, amount: number): number => {
  const shift = (channel: number): number => clamp(Math.round(channel + amount * 255), 0, 255);
  return (
    (shift((hex >> 16) & 0xff) << 16) |
    (shift((hex >> 8) & 0xff) << 8) |
    shift(hex & 0xff)
  );
};

class Painter {
  readonly image: RgbaImage;

  constructor(
    readonly logicalWidth: number,
    readonly logicalHeight: number,
    readonly scale: number
  ) {
    this.image = {
      width: logicalWidth * scale,
      height: logicalHeight * scale,
      data: new Uint8Array(logicalWidth * logicalHeight * scale * scale * 4),
    };
  }

  private blendPixel(x: number, y: number, source: Rgba): void {
    if (x < 0 || y < 0 || x >= this.image.width || y >= this.image.height) return;
    const offset = (y * this.image.width + x) * 4;
    const sourceAlpha = source[3] / 255;
    if (sourceAlpha <= 0) return;
    const targetAlpha = this.image.data[offset + 3] / 255;
    const outputAlpha = sourceAlpha + targetAlpha * (1 - sourceAlpha);
    if (outputAlpha <= 0) return;
    this.image.data[offset] = Math.round(
      (source[0] * sourceAlpha + this.image.data[offset] * targetAlpha * (1 - sourceAlpha)) /
        outputAlpha
    );
    this.image.data[offset + 1] = Math.round(
      (source[1] * sourceAlpha +
        this.image.data[offset + 1] * targetAlpha * (1 - sourceAlpha)) /
        outputAlpha
    );
    this.image.data[offset + 2] = Math.round(
      (source[2] * sourceAlpha +
        this.image.data[offset + 2] * targetAlpha * (1 - sourceAlpha)) /
        outputAlpha
    );
    this.image.data[offset + 3] = Math.round(outputAlpha * 255);
  }

  fillRect(x: number, y: number, width: number, height: number, fill: Rgba): void {
    const left = Math.floor(x * this.scale);
    const top = Math.floor(y * this.scale);
    const right = Math.ceil((x + width) * this.scale);
    const bottom = Math.ceil((y + height) * this.scale);
    for (let pixelY = top; pixelY < bottom; pixelY += 1) {
      for (let pixelX = left; pixelX < right; pixelX += 1) this.blendPixel(pixelX, pixelY, fill);
    }
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, fill: Rgba): void {
    const left = Math.floor((cx - rx) * this.scale);
    const right = Math.ceil((cx + rx) * this.scale);
    const top = Math.floor((cy - ry) * this.scale);
    const bottom = Math.ceil((cy + ry) * this.scale);
    for (let y = top; y <= bottom; y += 1) {
      for (let x = left; x <= right; x += 1) {
        const logicalX = (x + 0.5) / this.scale;
        const logicalY = (y + 0.5) / this.scale;
        const normalized = ((logicalX - cx) / rx) ** 2 + ((logicalY - cy) / ry) ** 2;
        if (normalized <= 1) this.blendPixel(x, y, fill);
      }
    }
  }

  polygon(points: readonly { x: number; y: number }[], fill: Rgba): void {
    const scaled = points.map((point) => ({ x: point.x * this.scale, y: point.y * this.scale }));
    const minX = Math.floor(Math.min(...scaled.map((point) => point.x)));
    const maxX = Math.ceil(Math.max(...scaled.map((point) => point.x)));
    const minY = Math.floor(Math.min(...scaled.map((point) => point.y)));
    const maxY = Math.ceil(Math.max(...scaled.map((point) => point.y)));
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        let inside = false;
        for (let current = 0, previous = scaled.length - 1; current < scaled.length; previous = current++) {
          const a = scaled[current];
          const b = scaled[previous];
          const crosses =
            a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x;
          if (crosses) inside = !inside;
        }
        if (inside) this.blendPixel(x, y, fill);
      }
    }
  }

  line(x1: number, y1: number, x2: number, y2: number, width: number, fill: Rgba): void {
    const distance = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.max(1, Math.ceil(distance * this.scale * 1.5));
    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      this.ellipse(
        x1 + (x2 - x1) * t,
        y1 + (y2 - y1) * t,
        width / 2,
        width / 2,
        fill
      );
    }
  }

  roundedRect(x: number, y: number, width: number, height: number, radius: number, fill: Rgba): void {
    this.fillRect(x + radius, y, width - radius * 2, height, fill);
    this.fillRect(x, y + radius, width, height - radius * 2, fill);
    this.ellipse(x + radius, y + radius, radius, radius, fill);
    this.ellipse(x + width - radius, y + radius, radius, radius, fill);
    this.ellipse(x + radius, y + height - radius, radius, radius, fill);
    this.ellipse(x + width - radius, y + height - radius, radius, radius, fill);
  }
}

const DIRECTION_VECTOR: Record<CharacterSpriteDirection, { x: number; y: number }> = {
  north: { x: 0, y: -1 },
  'north-east': { x: 0.72, y: -0.72 },
  east: { x: 1, y: 0 },
  'south-east': { x: 0.72, y: 0.72 },
  south: { x: 0, y: 1 },
  'south-west': { x: -0.72, y: 0.72 },
  west: { x: -1, y: 0 },
  'north-west': { x: -0.72, y: -0.72 },
};

const MOVE_PHASE = [-1, 0, 1, 0] as const;
const MOVE_BOB = [0, -1, 0, -1] as const;
const INTERACT_REACH = [0, 1.6, 3.2, 1.2] as const;

const drawOutlinedEllipse = (
  painter: Painter,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fill: number,
  outline = 0x17191a
): void => {
  painter.ellipse(cx, cy, rx + 1, ry + 1, color(outline, 245));
  painter.ellipse(cx, cy, rx, ry, color(fill));
};

const drawHair = (
  painter: Painter,
  profile: ActorStyleProfile,
  headX: number,
  headY: number,
  facing: { x: number; y: number }
): void => {
  const hair = color(profile.hair);
  switch (profile.hairStyle) {
    case 'curls':
      for (const [dx, dy, radius] of [
        [-3.3, -4.5, 2.3],
        [-1.2, -5.7, 2.5],
        [1.2, -5.9, 2.5],
        [3.2, -4.7, 2.2],
        [0, -3.8, 3.2],
      ] as const) {
        painter.ellipse(headX + dx, headY + dy, radius, radius, hair);
      }
      break;
    case 'bun':
      painter.ellipse(headX, headY - 4.5, profile.headWidth * 0.55, 3.2, hair);
      painter.ellipse(headX - facing.x * 2.4, headY - 7.7, 2.6, 2.3, hair);
      break;
    case 'cap':
      painter.ellipse(headX, headY - 4.4, profile.headWidth * 0.58, 2.8, hair);
      painter.line(
        headX,
        headY - 4.3,
        headX + (facing.x || 1) * 5.2,
        headY - 3.8,
        1.4,
        color(shade(profile.jacket, 0.06))
      );
      break;
    case 'crop':
      painter.ellipse(headX, headY - 4.8, profile.headWidth * 0.48, 2.7, hair);
      break;
    case 'short':
      painter.ellipse(headX, headY - 4.6, profile.headWidth * 0.54, 3.1, hair);
      painter.line(headX - 3.5, headY - 4.2, headX + 2.5, headY - 6.1, 1, color(shade(profile.hair, 0.08)));
      break;
  }
  if (facing.y < -0.35) {
    painter.ellipse(
      headX - facing.x * 0.4,
      headY - 0.8,
      profile.headWidth * (Math.abs(facing.x) > 0.35 ? 0.4 : 0.5),
      5.1,
      color(profile.hair, 235)
    );
    painter.line(
      headX - profile.headWidth * 0.34,
      headY + 2.6,
      headX + profile.headWidth * 0.34,
      headY + 3.4,
      0.8,
      color(shade(profile.hair, 0.08), 180)
    );
  }
};

const drawFaceDetail = (
  painter: Painter,
  headX: number,
  headY: number,
  facing: { x: number; y: number },
  skin: number
): void => {
  if (facing.y < -0.35) return;
  const feature = color(shade(skin, -0.28), 210);
  if (Math.abs(facing.x) > 0.85) {
    painter.polygon(
      [
        { x: headX + facing.x * 2.8, y: headY - 1.2 },
        { x: headX + facing.x * 5.1, y: headY + 0.2 },
        { x: headX + facing.x * 2.8, y: headY + 1.1 },
      ],
      feature
    );
    painter.ellipse(headX + facing.x * 1.8, headY - 1.2, 0.6, 0.45, feature);
    return;
  }
  painter.ellipse(headX - 1.7 + facing.x, headY - 1.1, 0.45, 0.4, feature);
  painter.ellipse(headX + 1.7 + facing.x, headY - 1.1, 0.45, 0.4, feature);
  painter.line(headX - 1, headY + 2.1, headX + 1.2, headY + 2, 0.45, feature);
};

const drawAccessory = (
  painter: Painter,
  profile: ActorStyleProfile,
  torsoX: number,
  torsoY: number,
  shoulderWidth: number,
  facing: { x: number; y: number },
  reach: number
): void => {
  if (profile.accessory === 'none') return;
  const side = facing.y < -0.35 ? -profile.accessorySide : profile.accessorySide;
  const sideCompression = Math.abs(facing.x) > 0.85 ? 0.55 : 1;
  const bagX = torsoX + side * (shoulderWidth * 0.5 + 3.6) * sideCompression;
  const bagColor = color(shade(profile.accent, -0.08));
  const outline = color(0x17191a, 245);

  if (['messenger', 'service-bag', 'delivery-bag', 'medical-bag'].includes(profile.accessory)) {
    painter.line(
      torsoX - side * shoulderWidth * 0.35,
      torsoY - 8,
      bagX,
      torsoY + 8,
      1.2,
      color(shade(profile.accent, 0.02), 230)
    );
    const width = profile.accessory === 'medical-bag' ? 10 : profile.accessory === 'delivery-bag' ? 9 : 8;
    const height = profile.accessory === 'medical-bag' ? 8 : 9;
    painter.roundedRect(bagX - width / 2 - 0.7, torsoY + 4.3, width + 1.4, height + 1.4, 1.4, outline);
    painter.roundedRect(bagX - width / 2, torsoY + 5, width, height, 1.2, bagColor);
    if (profile.accessory === 'medical-bag') {
      painter.line(bagX - 2.5, torsoY + 9, bagX + 2.5, torsoY + 9, 1, color(profile.accent));
      painter.line(bagX, torsoY + 6.5, bagX, torsoY + 11.5, 1, color(profile.accent));
    }
    return;
  }

  if (profile.accessory === 'toolbox') {
    painter.roundedRect(bagX - 5.5, torsoY + 10, 11, 6, 1, outline);
    painter.roundedRect(bagX - 4.8, torsoY + 10.6, 9.6, 4.8, 0.8, bagColor);
    painter.line(bagX - 2, torsoY + 9.8, bagX + 2, torsoY + 9.8, 1.2, color(profile.accent));
    return;
  }

  const handX = torsoX + (facing.x || side) * (shoulderWidth * 0.58 + reach + 2);
  const handY = torsoY - 1 - facing.y * reach * 0.35;
  if (profile.accessory === 'document-pouch' || profile.accessory === 'folio') {
    painter.roundedRect(bagX - 3.6, torsoY + 1, 7.2, 10, 0.7, outline);
    painter.roundedRect(bagX - 3, torsoY + 1.7, 6, 8.6, 0.5, color(profile.accent));
  } else if (profile.accessory === 'identity-scanner') {
    painter.roundedRect(handX - 2.2, handY - 3, 4.4, 6, 0.8, outline);
    painter.roundedRect(handX - 1.5, handY - 2.2, 3, 4.4, 0.5, color(0x4c8d93));
    painter.ellipse(handX, handY - 1, 0.7, 0.7, color(0x77c4c9));
  } else if (profile.accessory === 'tablet') {
    painter.roundedRect(handX - 3.4, handY - 4.2, 6.8, 8.4, 0.8, outline);
    painter.roundedRect(handX - 2.7, handY - 3.5, 5.4, 7, 0.5, color(0x416f73));
    painter.line(handX - 1.8, handY - 1, handX + 1.8, handY - 1, 0.7, color(0x75b5b8));
  }
};

const renderActorFrame = (
  profile: ActorStyleProfile,
  state: CharacterSpriteState,
  direction: CharacterSpriteDirection,
  frameIndex: number
): RgbaImage => {
  const painter = new Painter(64, 96, SUPERSAMPLE);
  const facing = DIRECTION_VECTOR[direction];
  const movePhase = state === 'move' ? MOVE_PHASE[frameIndex] : 0;
  const bob = state === 'move' ? MOVE_BOB[frameIndex] : 0;
  const idleShift = state === 'idle' ? [0, 0.25, 0, -0.25][frameIndex] : 0;
  const reach = state === 'interact' ? INTERACT_REACH[frameIndex] : 0;
  const torsoX = 32 + facing.x * 0.7 + idleShift;
  const torsoTop = 42 + bob + profile.heightOffset;
  const torsoBottom = torsoTop + profile.jacketLength;
  const sideView = Math.abs(facing.x) > 0.85;
  const diagonalView = Math.abs(facing.x) > 0.35 && Math.abs(facing.x) <= 0.85;
  const backView = facing.y < -0.35;
  const frontView = facing.y > 0.35;
  const shoulderWidth = profile.shoulderWidth * (sideView ? 0.58 : diagonalView ? 0.82 : 1);
  const bodyWidth = profile.bodyWidth * (sideView ? 0.62 : diagonalView ? 0.84 : 1);
  const outline = 0x16191a;

  const leftFootX = torsoX - (sideView ? 2.2 : 4.2) - movePhase * 1.7 * (facing.x || 1);
  const rightFootX = torsoX + (sideView ? 2.2 : 4.2) + movePhase * 1.7 * (facing.x || 1);
  const leftFootBottom = movePhase > 0 ? 85.5 : 88;
  const rightFootBottom = movePhase < 0 ? 85.5 : 88;
  const hipY = torsoBottom - 1;

  painter.line(torsoX - bodyWidth * 0.22, hipY, leftFootX, leftFootBottom - 2.2, 5.2, color(outline));
  painter.line(torsoX + bodyWidth * 0.22, hipY, rightFootX, rightFootBottom - 2.2, 5.2, color(outline));
  painter.line(
    torsoX - bodyWidth * 0.22,
    hipY,
    leftFootX,
    leftFootBottom - 2.2,
    3.6,
    color(shade(profile.trousers, facing.y < 0 ? -0.04 : 0.01))
  );
  painter.line(
    torsoX + bodyWidth * 0.22,
    hipY,
    rightFootX,
    rightFootBottom - 2.2,
    3.6,
    color(shade(profile.trousers, -0.08))
  );
  painter.roundedRect(leftFootX - 3.8, leftFootBottom - 2.5, 7.6, 2.5, 0.8, color(outline));
  painter.roundedRect(leftFootX - 3.1, leftFootBottom - 2.2, 6.2, 2.0, 0.6, color(profile.shoes));
  painter.roundedRect(rightFootX - 3.8, rightFootBottom - 2.5, 7.6, 2.5, 0.8, color(outline));
  painter.roundedRect(rightFootX - 3.1, rightFootBottom - 2.2, 6.2, 2.0, 0.6, color(shade(profile.shoes, -0.04)));

  painter.polygon(
    [
      { x: torsoX - shoulderWidth / 2 - 1, y: torsoTop },
      { x: torsoX + shoulderWidth / 2 + 1, y: torsoTop },
      { x: torsoX + bodyWidth / 2 + 1, y: torsoBottom },
      { x: torsoX - bodyWidth / 2 - 1, y: torsoBottom },
    ],
    color(outline)
  );
  painter.polygon(
    [
      { x: torsoX - shoulderWidth / 2, y: torsoTop + 0.8 },
      { x: torsoX + shoulderWidth / 2, y: torsoTop + 0.8 },
      { x: torsoX + bodyWidth / 2, y: torsoBottom - 0.5 },
      { x: torsoX - bodyWidth / 2, y: torsoBottom - 0.5 },
    ],
    color(profile.jacket)
  );
  painter.polygon(
    [
      { x: torsoX - shoulderWidth / 2 + 1, y: torsoTop + 1.4 },
      { x: torsoX - 0.5, y: torsoTop + 1.4 },
      { x: torsoX - 1.2, y: torsoBottom - 1.3 },
      { x: torsoX - bodyWidth / 2 + 1, y: torsoBottom - 1.3 },
    ],
    color(shade(profile.jacket, 0.08), 190)
  );
  if (backView) {
    painter.line(
      torsoX - shoulderWidth * 0.38,
      torsoTop + 6,
      torsoX + shoulderWidth * 0.38,
      torsoTop + 6 + Math.abs(facing.x) * 1.2,
      1.1,
      color(shade(profile.jacket, -0.13), 210)
    );
    painter.line(
      torsoX + facing.x * 1.1,
      torsoTop + 7,
      torsoX + facing.x * 0.4,
      torsoBottom - 3,
      0.8,
      color(shade(profile.jacket, 0.11), 165)
    );
  } else {
    const chestShift = sideView ? facing.x * 1.3 : diagonalView ? facing.x * 0.8 : 0;
    painter.polygon(
      [
        { x: torsoX - 3.2 + chestShift, y: torsoTop + 1.2 },
        { x: torsoX + 3.2 + chestShift, y: torsoTop + 1.2 },
        { x: torsoX + 2.2 + chestShift, y: torsoTop + 11 },
        { x: torsoX - 2.2 + chestShift, y: torsoTop + 11 },
      ],
      color(profile.shirt)
    );
    painter.line(
      torsoX + chestShift,
      torsoTop + 2,
      torsoX + chestShift * 0.3,
      torsoBottom - 2,
      0.8,
      color(shade(profile.jacket, -0.16), 185)
    );
  }
  const brushSide = facing.x >= 0 ? -1 : 1;
  painter.line(
    torsoX + brushSide * bodyWidth * 0.22,
    torsoTop + 10,
    torsoX + brushSide * bodyWidth * 0.35,
    torsoTop + 15,
    0.65,
    color(shade(profile.jacket, frontView ? 0.12 : -0.1), 145)
  );

  const armSwing = state === 'move' ? movePhase * 2.6 : 0;
  const interactDirectionX = facing.x || profile.accessorySide;
  const leftHandX = torsoX - shoulderWidth / 2 - 1 - armSwing + (interactDirectionX < 0 ? -reach : 0);
  const rightHandX = torsoX + shoulderWidth / 2 + 1 + armSwing + (interactDirectionX >= 0 ? reach : 0);
  const leftHandY = torsoTop + 16 + armSwing * 0.25 - (interactDirectionX < 0 ? reach * facing.y * 0.4 : 0);
  const rightHandY = torsoTop + 16 - armSwing * 0.25 - (interactDirectionX >= 0 ? reach * facing.y * 0.4 : 0);
  painter.line(torsoX - shoulderWidth / 2 + 1, torsoTop + 3, leftHandX, leftHandY, 5, color(outline));
  painter.line(torsoX + shoulderWidth / 2 - 1, torsoTop + 3, rightHandX, rightHandY, 5, color(outline));
  painter.line(torsoX - shoulderWidth / 2 + 1, torsoTop + 3, leftHandX, leftHandY, 3.3, color(shade(profile.jacket, 0.02)));
  painter.line(torsoX + shoulderWidth / 2 - 1, torsoTop + 3, rightHandX, rightHandY, 3.3, color(shade(profile.jacket, -0.06)));
  drawOutlinedEllipse(painter, leftHandX, leftHandY, 1.8, 2.1, profile.skin, outline);
  drawOutlinedEllipse(painter, rightHandX, rightHandY, 1.8, 2.1, profile.skin, outline);

  const neckY = torsoTop - 1;
  painter.roundedRect(torsoX - 2, neckY - 1.4, 4, 4, 1.2, color(profile.skin));
  const headX = torsoX + facing.x * (sideView ? 3.2 : diagonalView ? 2.2 : 0.4);
  const headY = torsoTop - 6 + bob * 0.5;
  drawOutlinedEllipse(
    painter,
    headX,
    headY,
    (profile.headWidth / 2) * (sideView ? 0.72 : diagonalView ? 0.88 : 1),
    6,
    facing.y < -0.35 ? shade(profile.skin, -0.06) : profile.skin,
    outline
  );
  painter.ellipse(
    headX - (sideView ? facing.x * 0.8 : 1.6),
    headY - 1.8,
    sideView ? 0.8 : 1.2,
    3.5,
    color(shade(profile.skin, 0.12), backView ? 55 : 120)
  );
  drawFaceDetail(painter, headX, headY, facing, profile.skin);
  drawHair(painter, profile, headX, headY, facing);
  drawAccessory(painter, profile, torsoX, torsoTop + 9, shoulderWidth, facing, reach);

  return resizeRgbaBox(painter.image, 64, 96);
};

const blit = (target: RgbaImage, source: RgbaImage, targetX: number, targetY: number): void => {
  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const sourceOffset = (y * source.width + x) * 4;
      const targetOffset = ((targetY + y) * target.width + targetX + x) * 4;
      target.data.set(source.data.subarray(sourceOffset, sourceOffset + 4), targetOffset);
    }
  }
};

const composite = (target: RgbaImage, source: RgbaImage, targetX: number, targetY: number): void => {
  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const sourceOffset = (y * source.width + x) * 4;
      const targetOffset = ((targetY + y) * target.width + targetX + x) * 4;
      const sourceAlpha = source.data[sourceOffset + 3] / 255;
      const targetAlpha = target.data[targetOffset + 3] / 255;
      const outputAlpha = sourceAlpha + targetAlpha * (1 - sourceAlpha);
      if (outputAlpha <= 0) continue;
      for (let channel = 0; channel < 3; channel += 1) {
        target.data[targetOffset + channel] = Math.round(
          (source.data[sourceOffset + channel] * sourceAlpha +
            target.data[targetOffset + channel] * targetAlpha * (1 - sourceAlpha)) /
            outputAlpha
        );
      }
      target.data[targetOffset + 3] = Math.round(outputAlpha * 255);
    }
  }
};

const drawProceduralPortrait = (profile: ActorStyleProfile): RgbaImage => {
  const painter = new Painter(256, 256, 2);
  for (let y = 0; y < 256; y += 1) {
    const t = y / 255;
    const base = shade(0x242322, t * -0.08);
    painter.fillRect(0, y, 256, 1, color(base));
  }
  painter.polygon(
    [
      { x: 0, y: 184 },
      { x: 256, y: 112 },
      { x: 256, y: 152 },
      { x: 0, y: 224 },
    ],
    color(profile.accent, 36)
  );
  for (let stripe = -100; stripe < 320; stripe += 42) {
    painter.line(stripe, 256, stripe + 160, 0, 1, color(0xd8c9ad, 18));
  }

  const shoulderY = 190;
  painter.polygon(
    [
      { x: 36, y: 256 },
      { x: 52, y: shoulderY },
      { x: 99, y: 166 },
      { x: 157, y: 166 },
      { x: 204, y: shoulderY },
      { x: 220, y: 256 },
    ],
    color(0x151718)
  );
  painter.polygon(
    [
      { x: 42, y: 256 },
      { x: 58, y: shoulderY + 2 },
      { x: 102, y: 171 },
      { x: 154, y: 171 },
      { x: 198, y: shoulderY + 2 },
      { x: 214, y: 256 },
    ],
    color(profile.jacket)
  );
  painter.polygon(
    [
      { x: 45, y: 256 },
      { x: 62, y: shoulderY + 6 },
      { x: 124, y: 176 },
      { x: 116, y: 256 },
    ],
    color(shade(profile.jacket, 0.08), 170)
  );
  painter.polygon(
    [
      { x: 102, y: 170 },
      { x: 154, y: 170 },
      { x: 166, y: 256 },
      { x: 91, y: 256 },
    ],
    color(profile.shirt)
  );
  painter.roundedRect(112, 139, 32, 46, 12, color(profile.skin));
  drawOutlinedEllipse(painter, 128, 105, 39, 53, profile.skin, 0x151718);
  painter.ellipse(110, 91, 12, 28, color(shade(profile.skin, 0.12), 105));
  painter.ellipse(113, 102, 4, 3, color(shade(profile.skin, -0.32)));
  painter.ellipse(143, 102, 4, 3, color(shade(profile.skin, -0.32)));
  painter.line(128, 105, 124, 126, 2, color(shade(profile.skin, -0.18), 200));
  painter.line(114, 140, 142, 140, 2, color(shade(profile.skin, -0.3), 210));

  const portraitFacing = { x: 0.12, y: 1 };
  switch (profile.hairStyle) {
    case 'curls':
      for (const [dx, dy, radius] of [
        [-30, -36, 19],
        [-12, -48, 21],
        [10, -49, 21],
        [29, -37, 19],
        [0, -29, 27],
      ] as const) {
        painter.ellipse(128 + dx, 88 + dy, radius, radius, color(profile.hair));
      }
      break;
    case 'bun':
      painter.ellipse(128, 61, 43, 32, color(profile.hair));
      painter.ellipse(114, 27, 21, 18, color(profile.hair));
      break;
    case 'cap':
      painter.ellipse(128, 59, 46, 28, color(profile.hair));
      painter.line(128, 63, 178, 67, 9, color(shade(profile.jacket, 0.06)));
      break;
    case 'crop':
      painter.ellipse(128, 61, 42, 28, color(profile.hair));
      break;
    case 'short':
      painter.ellipse(128, 59, 45, 31, color(profile.hair));
      painter.line(96, 65, 145, 48, 5, color(shade(profile.hair, 0.08)));
      break;
  }
  drawAccessory(painter, profile, 128, 204, 80, portraitFacing, 0);
  return resizeRgbaBox(painter.image, 256, 256);
};

const drawTakahiroPortrait = (): RgbaImage => {
  const profile: ActorStyleProfile = {
    actorId: 'takahiro_broadcast',
    skin: 0xb17a5d,
    hair: 0x232323,
    jacket: 0x202629,
    shirt: 0xd3c7b4,
    trousers: 0x202629,
    shoes: 0x17191a,
    accent: 0xa47a45,
    hairStyle: 'short',
    accessory: 'none',
    accessorySide: 1,
    bodyWidth: 12,
    shoulderWidth: 17,
    headWidth: 9,
    jacketLength: 21,
    heightOffset: 0,
    portraitCrop: { x: 0, y: 0, width: 256, height: 256 },
  };
  const portrait = drawProceduralPortrait(profile);
  const painter = new Painter(256, 256, 1);
  blit(painter.image, portrait, 0, 0);
  painter.fillRect(18, 18, 7, 80, color(0xb18349, 190));
  painter.fillRect(30, 18, 2, 54, color(0x6f9da0, 130));
  painter.line(190, 24, 232, 24, 2, color(0xd5c6aa, 120));
  painter.line(206, 31, 232, 31, 1, color(0xd5c6aa, 90));
  return painter.image;
};

const drawGeorgeAr = (): RgbaImage => {
  const painter = new Painter(256, 256, 2);
  const cyan = 0x6ab9bd;
  const bone = 0xd7cbb4;
  painter.ellipse(128, 126, 83, 98, color(0x28464a, 42));
  painter.ellipse(128, 108, 42, 55, color(0x31565a, 92));
  painter.ellipse(128, 104, 36, 49, color(0x5c7470, 88));
  painter.line(100, 79, 114, 55, 3, color(cyan, 190));
  painter.line(114, 55, 142, 54, 2, color(bone, 150));
  painter.line(142, 54, 158, 78, 3, color(cyan, 190));
  painter.line(94, 125, 102, 168, 3, color(cyan, 170));
  painter.line(102, 168, 154, 168, 2, color(bone, 130));
  painter.line(154, 168, 163, 125, 3, color(cyan, 170));
  painter.ellipse(114, 104, 4, 3, color(bone, 220));
  painter.ellipse(142, 104, 4, 3, color(bone, 220));
  painter.line(115, 131, 141, 131, 2, color(bone, 160));
  for (let line = 0; line < 7; line += 1) {
    const y = 57 + line * 22;
    painter.line(61 + (line % 2) * 8, y, 195 - (line % 3) * 7, y, 1, color(cyan, 58));
  }
  painter.line(52, 205, 204, 205, 2, color(cyan, 110));
  painter.line(76, 214, 180, 214, 1, color(bone, 70));
  return resizeRgbaBox(painter.image, 256, 256);
};

const deriveReferencePortrait = (
  board: RgbaImage,
  profile: ActorStyleProfile
): RgbaImage => {
  const { x, y, width, height } = profile.portraitCrop;
  if (x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > board.width || y + height > board.height) {
    throw new Error(`Portrait crop for ${profile.actorId} is outside the portrait reference board`);
  }
  return resizeRgbaBilinear(extractRgbaRegion(board, x, y, width, height), 256, 256);
};

const createSheet = (
  profile: ActorStyleProfile,
  state: CharacterSpriteState,
  direction: CharacterSpriteDirection
): { image: RgbaImage; frames: CharacterSpriteFrameMetrics[] } => {
  const sheet: RgbaImage = {
    width: 64 * 4,
    height: 96,
    data: new Uint8Array(64 * 4 * 96 * 4),
  };
  const frames: CharacterSpriteFrameMetrics[] = [];
  for (let frameIndex = 0; frameIndex < 4; frameIndex += 1) {
    const frame = renderActorFrame(profile, state, direction, frameIndex);
    blit(sheet, frame, frameIndex * 64, 0);
    frames.push(measureAlpha(frame));
  }
  return { image: sheet, frames };
};

interface IntegrityRecord {
  sha256: string;
  compressedBytes: number;
  decodedBytes: number;
}

interface ActorIntegrityRecord {
  portrait: IntegrityRecord;
  sheets: Record<string, IntegrityRecord>;
  metrics: IntegrityRecord;
}

const writePng = async (filePath: string, image: RgbaImage): Promise<IntegrityRecord> => {
  const png = encodeRgbaPng(image);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, png);
  return {
    sha256: sha256Hex(png),
    compressedBytes: png.length,
    decodedBytes: image.width * image.height * 4,
  };
};

const writeJson = async (filePath: string, value: unknown): Promise<IntegrityRecord> => {
  const buffer = Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
  return {
    sha256: sha256Hex(buffer),
    compressedBytes: buffer.length,
    decodedBytes: buffer.length,
  };
};

const buildActor = async (
  entry: CharacterSpriteManifestEntry,
  portraitReferenceBoard: RgbaImage
): Promise<{ integrity: ActorIntegrityRecord; portrait: RgbaImage; sampleSheets: Record<string, RgbaImage> }> => {
  const profile = PROFILES[entry.actorId];
  if (!profile) throw new Error(`Missing grounded actor profile for ${entry.actorId}`);
  const actorDir = path.join(CHARACTER_OUTPUT_DIR, entry.spriteSetId);
  const states = {} as CharacterSpriteSheetMetrics['states'];
  const sheetIntegrity: Record<string, IntegrityRecord> = {};
  const sampleSheets: Record<string, RgbaImage> = {};

  for (const state of CHARACTER_SPRITE_STATES) {
    states[state] = {} as CharacterSpriteSheetMetrics['states'][CharacterSpriteState];
    for (const direction of CHARACTER_SPRITE_DIRECTIONS) {
      const sheet = createSheet(profile, state, direction);
      const key = `${state}-${direction}`;
      states[state][direction] = { frames: sheet.frames };
      sheetIntegrity[key] = await writePng(path.join(actorDir, `${key}.png`), sheet.image);
      if (direction === 'south-east') sampleSheets[state] = sheet.image;
    }
  }

  const metrics: CharacterSpriteSheetMetrics = {
    schemaVersion: 2,
    actorId: entry.actorId,
    frameWidth: 64,
    frameHeight: 96,
    origin: { x: 0.5, y: 0.92 },
    alphaOccupancy: entry.alphaOccupancy,
    states,
  };
  const metricsIntegrity = await writeJson(path.join(actorDir, 'sheet-metrics.json'), metrics);
  const portrait = deriveReferencePortrait(portraitReferenceBoard, profile);
  const portraitIntegrity = await writePng(
    path.join(PORTRAIT_OUTPUT_DIR, `${entry.actorId}.png`),
    portrait
  );

  return {
    integrity: {
      portrait: portraitIntegrity,
      sheets: sheetIntegrity,
      metrics: metricsIntegrity,
    },
    portrait,
    sampleSheets,
  };
};

const fillImage = (width: number, height: number, hex: number): RgbaImage => {
  const image: RgbaImage = { width, height, data: new Uint8Array(width * height * 4) };
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const offset = pixel * 4;
    image.data[offset] = (hex >> 16) & 0xff;
    image.data[offset + 1] = (hex >> 8) & 0xff;
    image.data[offset + 2] = hex & 0xff;
    image.data[offset + 3] = 255;
  }
  return image;
};

const composeProofBoards = async (
  built: Record<string, { portrait: RgbaImage; sampleSheets: Record<string, RgbaImage> }>,
  takahiro: RgbaImage,
  george: RgbaImage
): Promise<Record<string, IntegrityRecord>> => {
  const proofIntegrity: Record<string, IntegrityRecord> = {};
  const actorBoard = fillImage(1280, 384, 0x17191a);
  CHARACTER_SPRITE_MANIFEST.forEach((entry, index) => {
    const column = index % 4;
    const row = Math.floor(index / 4);
    const cellX = column * 320;
    const cellY = row * 128;
    const portrait = resizeRgbaBilinear(built[entry.actorId].portrait, 120, 120);
    composite(actorBoard, portrait, cellX + 4, cellY + 4);
    CHARACTER_SPRITE_STATES.forEach((state, stateIndex) => {
      const frame = extractRgbaRegion(built[entry.actorId].sampleSheets[state], 64, 0, 64, 96);
      composite(actorBoard, frame, cellX + 124 + stateIndex * 64, cellY + 16);
    });
  });
  proofIntegrity.actorRoster = await writePng(
    path.join(PROOF_OUTPUT_DIR, 'actor-roster-board.png'),
    actorBoard
  );

  const portraitBoard = fillImage(512, 512, 0x17191a);
  const portraits = [
    ...CHARACTER_SPRITE_MANIFEST.map((entry) => built[entry.actorId].portrait),
    takahiro,
    george,
  ];
  portraits.forEach((portrait, index) => {
    const scaled = resizeRgbaBilinear(portrait, 128, 128);
    composite(portraitBoard, scaled, (index % 4) * 128, Math.floor(index / 4) * 128);
  });
  proofIntegrity.portraitRoster = await writePng(
    path.join(PROOF_OUTPUT_DIR, 'portrait-roster-board.png'),
    portraitBoard
  );

  const directionBoard = fillImage(512, 1152, 0x17191a);
  CHARACTER_SPRITE_MANIFEST.forEach((entry, actorIndex) => {
    CHARACTER_SPRITE_DIRECTIONS.forEach((direction, directionIndex) => {
      const frame = renderActorFrame(PROFILES[entry.actorId], 'idle', direction, 1);
      composite(directionBoard, frame, directionIndex * 64, actorIndex * 96);
    });
  });
  proofIntegrity.actorDirections = await writePng(
    path.join(PROOF_OUTPUT_DIR, 'actor-direction-board.png'),
    directionBoard
  );

  const animationBoard = fillImage(768, 1152, 0x17191a);
  CHARACTER_SPRITE_MANIFEST.forEach((entry, actorIndex) => {
    CHARACTER_SPRITE_STATES.forEach((state, stateIndex) => {
      const sheet = built[entry.actorId].sampleSheets[state];
      for (let frameIndex = 0; frameIndex < 4; frameIndex += 1) {
        const frame = extractRgbaRegion(sheet, frameIndex * 64, 0, 64, 96);
        composite(
          animationBoard,
          frame,
          stateIndex * 256 + frameIndex * 64,
          actorIndex * 96
        );
      }
    });
  });
  proofIntegrity.actorAnimations = await writePng(
    path.join(PROOF_OUTPUT_DIR, 'actor-animation-board.png'),
    animationBoard
  );

  return proofIntegrity;
};

const renderIntegrityModule = (
  actorIntegrity: Record<string, ActorIntegrityRecord>,
  nonWorldIntegrity: Record<string, IntegrityRecord>,
  provenance: ActorAssetProvenance
): string => {
  const portraits = Object.fromEntries(
    Object.entries(actorIntegrity).map(([actorId, value]) => [actorId, value.portrait])
  );
  return `// Generated by scripts/generate-grounded-character-assets.ts. Do not edit by hand.\n\nexport interface GeneratedAssetIntegrity {\n  sha256: string;\n  compressedBytes: number;\n  decodedBytes: number;\n}\n\nexport const GENERATED_ACTOR_PROVENANCE = ${JSON.stringify(
    provenance,
    null,
    2
  )} as const;\n\nexport const ACTOR_PORTRAIT_INTEGRITY: Record<string, GeneratedAssetIntegrity> = ${JSON.stringify(
    portraits,
    null,
    2
  )};\n\nexport const NON_WORLD_PRESENTATION_INTEGRITY: Record<string, GeneratedAssetIntegrity> = ${JSON.stringify(
    nonWorldIntegrity,
    null,
    2
  )};\n`;
};

interface ProvenanceFileRecord {
  path: string;
  sha256: string;
}

interface ActorAssetProvenance {
  recipeId: string;
  recipe: ProvenanceFileRecord;
  generator: ProvenanceFileRecord;
  pngLibrary: ProvenanceFileRecord;
  spriteReference: ProvenanceFileRecord & { id: string };
  portraitReference: ProvenanceFileRecord & { id: string };
}

interface GeneratedTarget {
  label: string;
  stagedPath: string;
  finalPath: string;
}

const GENERATED_TARGETS: readonly GeneratedTarget[] = [
  {
    label: 'characters',
    stagedPath: CHARACTER_OUTPUT_DIR,
    finalPath: FINAL_CHARACTER_OUTPUT_DIR,
  },
  {
    label: 'portraits',
    stagedPath: PORTRAIT_OUTPUT_DIR,
    finalPath: FINAL_PORTRAIT_OUTPUT_DIR,
  },
  {
    label: 'proof',
    stagedPath: PROOF_OUTPUT_DIR,
    finalPath: FINAL_PROOF_OUTPUT_DIR,
  },
  {
    label: 'generated-integrity-module',
    stagedPath: INTEGRITY_TS_PATH,
    finalPath: FINAL_INTEGRITY_TS_PATH,
  },
];

const pathExists = async (targetPath: string): Promise<boolean> => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const collectFileHashes = async (
  targetPath: string,
  relativePath = ''
): Promise<Record<string, string>> => {
  const stat = await fs.lstat(targetPath);
  if (stat.isFile()) {
    return { [relativePath || '.']: sha256Hex(await fs.readFile(targetPath)) };
  }
  if (!stat.isDirectory()) {
    throw new Error(`Generated target is not a regular file or directory: ${targetPath}`);
  }
  const hashes: Record<string, string> = {};
  const entries = await fs.readdir(targetPath, { withFileTypes: true });
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const childRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
    Object.assign(
      hashes,
      await collectFileHashes(path.join(targetPath, entry.name), childRelativePath)
    );
  }
  return hashes;
};

const checkGeneratedOutputs = async (): Promise<void> => {
  for (const target of GENERATED_TARGETS) {
    if (!(await pathExists(target.finalPath))) {
      throw new Error(`${target.label}: published output is missing`);
    }
    const staged = await collectFileHashes(target.stagedPath);
    const published = await collectFileHashes(target.finalPath);
    if (JSON.stringify(staged) !== JSON.stringify(published)) {
      throw new Error(`${target.label}: published output does not match deterministic regeneration`);
    }
  }
};

const publishGeneratedOutputs = async (): Promise<void> => {
  const backupRoot = path.join(STAGING_ROOT, '.backup');
  const backups = new Map<string, string>();
  const published: GeneratedTarget[] = [];
  await fs.mkdir(backupRoot, { recursive: true });
  try {
    for (const target of GENERATED_TARGETS) {
      await fs.mkdir(path.dirname(target.finalPath), { recursive: true });
      if (await pathExists(target.finalPath)) {
        const backupPath = path.join(backupRoot, target.label);
        await fs.rename(target.finalPath, backupPath);
        backups.set(target.finalPath, backupPath);
      }
    }
    for (const target of GENERATED_TARGETS) {
      await fs.rename(target.stagedPath, target.finalPath);
      published.push(target);
    }
  } catch (error) {
    for (const target of [...published].reverse()) {
      await fs.rm(target.finalPath, { recursive: true, force: true });
    }
    for (const [finalPath, backupPath] of [...backups.entries()].reverse()) {
      if (await pathExists(backupPath)) await fs.rename(backupPath, finalPath);
    }
    throw error;
  }
  await fs.rm(backupRoot, { recursive: true, force: true });
};

const main = async (): Promise<void> => {
  const generatorPath = path.resolve(import.meta.dirname, 'generate-grounded-character-assets.ts');
  const pngLibraryPath = path.resolve(import.meta.dirname, 'lib', 'rgbaPng.ts');
  const [spriteReference, portraitReference, recipeSource, generatorSource, pngLibrarySource] =
    await Promise.all([
      fs.readFile(SPRITE_REFERENCE_PATH),
      fs.readFile(PORTRAIT_REFERENCE_PATH),
      fs.readFile(RECIPE_PATH),
      fs.readFile(generatorPath),
      fs.readFile(pngLibraryPath),
    ]);
  const spriteReferenceSha256 = sha256Hex(spriteReference);
  if (spriteReferenceSha256 !== RECIPE.spriteReference.sha256) {
    throw new Error(`Cast reference hash mismatch: ${spriteReferenceSha256}`);
  }
  const portraitReferenceSha256 = sha256Hex(portraitReference);
  if (portraitReferenceSha256 !== RECIPE.portraitReference.sha256) {
    throw new Error(`Portrait reference hash mismatch: ${portraitReferenceSha256}`);
  }
  const manifestActorIds = CHARACTER_SPRITE_MANIFEST.map((entry) => entry.actorId);
  const recipeActorIds = Object.keys(PROFILES);
  if (JSON.stringify(recipeActorIds) !== JSON.stringify(manifestActorIds)) {
    throw new Error('Actor recipe order/roster does not exactly match the runtime manifest');
  }
  const portraitReferenceBoard = decodeRgbaPng(portraitReference);
  const provenance: ActorAssetProvenance = {
    recipeId: ACTOR_RECIPE_ID,
    recipe: {
      path: path.relative(REPOSITORY_ROOT, RECIPE_PATH),
      sha256: sha256Hex(recipeSource),
    },
    generator: {
      path: path.relative(REPOSITORY_ROOT, generatorPath),
      sha256: sha256Hex(generatorSource),
    },
    pngLibrary: {
      path: path.relative(REPOSITORY_ROOT, pngLibraryPath),
      sha256: sha256Hex(pngLibrarySource),
    },
    spriteReference: {
      id: RECIPE.spriteReference.id,
      path: path.relative(REPOSITORY_ROOT, SPRITE_REFERENCE_PATH),
      sha256: spriteReferenceSha256,
    },
    portraitReference: {
      id: RECIPE.portraitReference.id,
      path: path.relative(REPOSITORY_ROOT, PORTRAIT_REFERENCE_PATH),
      sha256: portraitReferenceSha256,
    },
  };

  const actorIntegrity: Record<string, ActorIntegrityRecord> = {};
  const built: Record<string, { portrait: RgbaImage; sampleSheets: Record<string, RgbaImage> }> = {};
  for (const entry of CHARACTER_SPRITE_MANIFEST) {
    const actor = await buildActor(entry, portraitReferenceBoard);
    actorIntegrity[entry.actorId] = actor.integrity;
    built[entry.actorId] = { portrait: actor.portrait, sampleSheets: actor.sampleSheets };
  }

  const takahiro = drawTakahiroPortrait();
  const george = drawGeorgeAr();
  const nonWorldIntegrity = {
    takahiroBroadcast: await writePng(
      path.join(STAGING_APP_ROOT, 'public', NON_WORLD_CHARACTER_PRESENTATIONS.takahiroBroadcast.path),
      takahiro
    ),
    georgeAr: await writePng(
      path.join(STAGING_APP_ROOT, 'public', NON_WORLD_CHARACTER_PRESENTATIONS.georgeAr.path),
      george
    ),
  };

  const proofIntegrity = await composeProofBoards(built, takahiro, george);
  const proofManifest = {
    schemaVersion: 1,
    recipeId: ACTOR_RECIPE_ID,
    identityOrder: manifestActorIds,
    states: CHARACTER_SPRITE_STATES,
    directions: CHARACTER_SPRITE_DIRECTIONS,
    images: {
      actorRoster: { path: 'actor-roster-board.png', ...proofIntegrity.actorRoster },
      portraitRoster: { path: 'portrait-roster-board.png', ...proofIntegrity.portraitRoster },
      actorDirections: { path: 'actor-direction-board.png', ...proofIntegrity.actorDirections },
      actorAnimations: { path: 'actor-animation-board.png', ...proofIntegrity.actorAnimations },
    },
    inspectionStatus: 'pending-human-review',
  };
  const proofManifestIntegrity = await writeJson(
    path.join(PROOF_OUTPUT_DIR, 'proof-manifest.json'),
    proofManifest
  );

  const integrityPayload = {
    schemaVersion: 2,
    provenance,
    actors: actorIntegrity,
    nonWorldPresentations: nonWorldIntegrity,
    proof: {
      images: proofIntegrity,
      manifest: proofManifestIntegrity,
    },
  };
  await writeJson(INTEGRITY_JSON_PATH, integrityPayload);
  await fs.mkdir(path.dirname(INTEGRITY_TS_PATH), { recursive: true });
  await fs.writeFile(
    INTEGRITY_TS_PATH,
    renderIntegrityModule(actorIntegrity, nonWorldIntegrity, provenance),
    'utf8'
  );

  if (BUILD_MODE === 'check') await checkGeneratedOutputs();
  else await publishGeneratedOutputs();

  const sheetCount =
    CHARACTER_SPRITE_MANIFEST.length *
    CHARACTER_SPRITE_STATES.length *
    CHARACTER_SPRITE_DIRECTIONS.length;
  console.log(
    `[sprites] ${BUILD_MODE === 'check' ? 'Verified' : 'Published'} ${CHARACTER_SPRITE_MANIFEST.length} actors, ${sheetCount} sheets, 12 portraits, Takahiro, George, and proof boards`
  );
};

void main().finally(async () => {
  await fs.rm(STAGING_ROOT, { recursive: true, force: true });
});

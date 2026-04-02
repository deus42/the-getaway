import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const cellSize = 128;
const columns = 4;
const rows = 3;
const atlasWidth = cellSize * columns;
const atlasHeight = cellSize * rows;

const frames = [
  { id: 'street_lamp', col: 0, row: 0, pivot: { x: 0.5, y: 0.86 } },
  { id: 'vending_kiosk', col: 1, row: 0, pivot: { x: 0.5, y: 0.88 } },
  { id: 'market_stall', col: 2, row: 0, pivot: { x: 0.5, y: 0.88 } },
  { id: 'barricade_cart', col: 3, row: 0, pivot: { x: 0.5, y: 0.88 } },
  { id: 'camera_mast', col: 0, row: 1, pivot: { x: 0.5, y: 0.88 } },
  { id: 'neon_panel', col: 1, row: 1, pivot: { x: 0.5, y: 0.84 } },
  { id: 'bollards_cluster', col: 2, row: 1, pivot: { x: 0.5, y: 0.84 } },
  { id: 'dumpster_stack', col: 3, row: 1, pivot: { x: 0.5, y: 0.88 } },
  { id: 'door_canopy', col: 0, row: 2, pivot: { x: 0.5, y: 0.76 } },
  { id: 'puddle_tile', col: 1, row: 2, pivot: { x: 0.5, y: 0.58 } },
  { id: 'grate_tile', col: 2, row: 2, pivot: { x: 0.5, y: 0.58 } },
  { id: 'utility_patch', col: 3, row: 2, pivot: { x: 0.5, y: 0.58 } },
];

const atlas = new Uint8Array(atlasWidth * atlasHeight * 4);
const normals = new Uint8Array(atlasWidth * atlasHeight * 4);

const rgba = (hex, alpha = 255) => {
  const normalized = hex.startsWith('#') ? hex.slice(1) : hex;
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
    a: alpha,
  };
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const blendPixel = (buffer, x, y, color) => {
  if (x < 0 || y < 0 || x >= atlasWidth || y >= atlasHeight) {
    return;
  }

  const index = (y * atlasWidth + x) * 4;
  const srcAlpha = (color.a ?? 255) / 255;
  const dstAlpha = buffer[index + 3] / 255;
  const outAlpha = srcAlpha + dstAlpha * (1 - srcAlpha);

  if (outAlpha <= 0) {
    return;
  }

  const nextR = ((color.r * srcAlpha) + buffer[index] * dstAlpha * (1 - srcAlpha)) / outAlpha;
  const nextG = ((color.g * srcAlpha) + buffer[index + 1] * dstAlpha * (1 - srcAlpha)) / outAlpha;
  const nextB = ((color.b * srcAlpha) + buffer[index + 2] * dstAlpha * (1 - srcAlpha)) / outAlpha;

  buffer[index] = clamp(Math.round(nextR), 0, 255);
  buffer[index + 1] = clamp(Math.round(nextG), 0, 255);
  buffer[index + 2] = clamp(Math.round(nextB), 0, 255);
  buffer[index + 3] = clamp(Math.round(outAlpha * 255), 0, 255);
};

const fillRect = (buffer, x, y, width, height, color) => {
  for (let drawY = Math.floor(y); drawY < Math.floor(y + height); drawY += 1) {
    for (let drawX = Math.floor(x); drawX < Math.floor(x + width); drawX += 1) {
      blendPixel(buffer, drawX, drawY, color);
    }
  }
};

const fillEllipse = (buffer, cx, cy, radiusX, radiusY, color) => {
  const minX = Math.floor(cx - radiusX);
  const maxX = Math.ceil(cx + radiusX);
  const minY = Math.floor(cy - radiusY);
  const maxY = Math.ceil(cy + radiusY);

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const normalizedX = (x - cx) / radiusX;
      const normalizedY = (y - cy) / radiusY;
      if ((normalizedX * normalizedX) + (normalizedY * normalizedY) <= 1) {
        blendPixel(buffer, x, y, color);
      }
    }
  }
};

const fillDiamond = (buffer, cx, cy, width, height, color) => {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  for (let y = Math.floor(cy - halfHeight); y <= Math.ceil(cy + halfHeight); y += 1) {
    for (let x = Math.floor(cx - halfWidth); x <= Math.ceil(cx + halfWidth); x += 1) {
      const normalizedX = Math.abs((x - cx) / halfWidth);
      const normalizedY = Math.abs((y - cy) / halfHeight);
      if (normalizedX + normalizedY <= 1) {
        blendPixel(buffer, x, y, color);
      }
    }
  }
};

const pointInPolygon = (x, y, points) => {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x;
    const yi = points[i].y;
    const xj = points[j].x;
    const yj = points[j].y;
    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-6) + xi;
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
};

const fillPolygon = (buffer, points, color) => {
  const minX = Math.floor(Math.min(...points.map((point) => point.x)));
  const maxX = Math.ceil(Math.max(...points.map((point) => point.x)));
  const minY = Math.floor(Math.min(...points.map((point) => point.y)));
  const maxY = Math.ceil(Math.max(...points.map((point) => point.y)));

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      if (pointInPolygon(x + 0.5, y + 0.5, points)) {
        blendPixel(buffer, x, y, color);
      }
    }
  }
};

const drawLine = (buffer, startX, startY, endX, endY, color, thickness = 1) => {
  const steps = Math.max(Math.abs(endX - startX), Math.abs(endY - startY), 1);
  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    const x = startX + (endX - startX) * t;
    const y = startY + (endY - startY) * t;
    fillEllipse(buffer, x, y, thickness, thickness, color);
  }
};

const shadow = rgba('#030712', 112);
const cyan = rgba('#4fd8ff', 212);
const teal = rgba('#7ce9df', 188);
const amber = rgba('#f7b267', 212);
const brass = rgba('#c59a54', 220);
const slate = rgba('#172033', 230);
const steel = rgba('#42526c', 228);
const indigo = rgba('#4d3f84', 214);
const rust = rgba('#8e4a2f', 224);
const grime = rgba('#3f3029', 216);
const concrete = rgba('#5d6676', 210);
const lavender = rgba('#b67cff', 178);

const fillFrameBackground = (frame) => {
  const originX = frame.col * cellSize;
  const originY = frame.row * cellSize;
  fillEllipse(atlas, originX + cellSize / 2, originY + 105, 38, 14, shadow);
};

const drawStreetLamp = (frame) => {
  fillFrameBackground(frame);
  const ox = frame.col * cellSize;
  const oy = frame.row * cellSize;
  fillDiamond(atlas, ox + 64, oy + 102, 46, 18, rgba('#132033', 240));
  fillRect(atlas, ox + 60, oy + 32, 8, 70, steel);
  fillRect(atlas, ox + 46, oy + 26, 34, 9, concrete);
  fillDiamond(atlas, ox + 63, oy + 24, 42, 14, slate);
  fillEllipse(atlas, ox + 63, oy + 78, 30, 10, rgba('#57d4ff', 42));
  fillEllipse(atlas, ox + 63, oy + 80, 18, 6, rgba('#b7f0ff', 68));
};

const drawVendingKiosk = (frame) => {
  fillFrameBackground(frame);
  const ox = frame.col * cellSize;
  const oy = frame.row * cellSize;
  fillDiamond(atlas, ox + 64, oy + 104, 48, 18, rgba('#101827', 232));
  fillPolygon(atlas, [
    { x: ox + 36, y: oy + 40 },
    { x: ox + 84, y: oy + 32 },
    { x: ox + 84, y: oy + 98 },
    { x: ox + 36, y: oy + 106 },
  ], slate);
  fillPolygon(atlas, [
    { x: ox + 44, y: oy + 48 },
    { x: ox + 76, y: oy + 43 },
    { x: ox + 76, y: oy + 84 },
    { x: ox + 44, y: oy + 89 },
  ], rgba('#1d5c6d', 224));
  fillRect(atlas, ox + 44, oy + 91, 32, 9, grime);
  fillRect(atlas, ox + 44, oy + 38, 32, 5, cyan);
  fillEllipse(atlas, ox + 60, oy + 64, 26, 10, rgba('#57d4ff', 28));
};

const drawMarketStall = (frame) => {
  fillFrameBackground(frame);
  const ox = frame.col * cellSize;
  const oy = frame.row * cellSize;
  fillDiamond(atlas, ox + 64, oy + 104, 54, 18, rgba('#171d2c', 228));
  fillRect(atlas, ox + 41, oy + 54, 5, 44, concrete);
  fillRect(atlas, ox + 82, oy + 54, 5, 44, concrete);
  fillPolygon(atlas, [
    { x: ox + 28, y: oy + 44 },
    { x: ox + 95, y: oy + 34 },
    { x: ox + 88, y: oy + 58 },
    { x: ox + 34, y: oy + 66 },
  ], rust);
  fillRect(atlas, ox + 36, oy + 78, 54, 14, grime);
  fillRect(atlas, ox + 43, oy + 86, 16, 14, brass);
  fillRect(atlas, ox + 61, oy + 86, 18, 14, rgba('#2c4b52', 226));
};

const drawBarricadeCart = (frame) => {
  fillFrameBackground(frame);
  const ox = frame.col * cellSize;
  const oy = frame.row * cellSize;
  fillDiamond(atlas, ox + 64, oy + 106, 56, 16, rgba('#111827', 232));
  fillPolygon(atlas, [
    { x: ox + 34, y: oy + 74 },
    { x: ox + 78, y: oy + 66 },
    { x: ox + 92, y: oy + 90 },
    { x: ox + 48, y: oy + 98 },
  ], rust);
  fillRect(atlas, ox + 44, oy + 58, 22, 12, grime);
  fillRect(atlas, ox + 68, oy + 54, 16, 12, concrete);
  fillEllipse(atlas, ox + 46, oy + 102, 10, 10, slate);
  fillEllipse(atlas, ox + 84, oy + 96, 10, 10, slate);
  drawLine(atlas, ox + 48, oy + 76, ox + 90, oy + 60, brass, 1.5);
};

const drawCameraMast = (frame) => {
  fillFrameBackground(frame);
  const ox = frame.col * cellSize;
  const oy = frame.row * cellSize;
  fillDiamond(atlas, ox + 64, oy + 104, 44, 16, rgba('#111827', 232));
  fillRect(atlas, ox + 60, oy + 30, 8, 74, steel);
  fillPolygon(atlas, [
    { x: ox + 64, y: oy + 40 },
    { x: ox + 92, y: oy + 34 },
    { x: ox + 92, y: oy + 48 },
    { x: ox + 64, y: oy + 54 },
  ], slate);
  fillRect(atlas, ox + 84, oy + 37, 10, 8, concrete);
  fillEllipse(atlas, ox + 90, oy + 41, 4, 4, rgba('#ef4444', 235));
  fillPolygon(atlas, [
    { x: ox + 64, y: oy + 54 },
    { x: ox + 92, y: oy + 48 },
    { x: ox + 80, y: oy + 78 },
  ], rgba('#4fd8ff', 28));
};

const drawNeonPanel = (frame) => {
  fillFrameBackground(frame);
  const ox = frame.col * cellSize;
  const oy = frame.row * cellSize;
  fillDiamond(atlas, ox + 64, oy + 104, 44, 16, rgba('#111827', 232));
  fillRect(atlas, ox + 60, oy + 38, 8, 66, slate);
  fillPolygon(atlas, [
    { x: ox + 34, y: oy + 34 },
    { x: ox + 90, y: oy + 24 },
    { x: ox + 96, y: oy + 60 },
    { x: ox + 40, y: oy + 70 },
  ], indigo);
  drawLine(atlas, ox + 42, oy + 44, ox + 88, oy + 36, lavender, 2);
  drawLine(atlas, ox + 45, oy + 55, ox + 84, oy + 48, cyan, 2);
  fillEllipse(atlas, ox + 66, oy + 48, 36, 16, rgba('#57d4ff', 26));
};

const drawBollards = (frame) => {
  fillFrameBackground(frame);
  const ox = frame.col * cellSize;
  const oy = frame.row * cellSize;
  fillDiamond(atlas, ox + 64, oy + 106, 48, 16, rgba('#111827', 216));
  [48, 64, 80].forEach((x, index) => {
    fillRect(atlas, ox + x - 5, oy + 68 + index * 2, 10, 30, concrete);
    fillRect(atlas, ox + x - 5, oy + 68 + index * 2, 10, 7, cyan);
    fillEllipse(atlas, ox + x, oy + 98 + index, 8, 4, shadow);
  });
};

const drawDumpsterStack = (frame) => {
  fillFrameBackground(frame);
  const ox = frame.col * cellSize;
  const oy = frame.row * cellSize;
  fillDiamond(atlas, ox + 64, oy + 106, 54, 18, rgba('#111827', 220));
  fillPolygon(atlas, [
    { x: ox + 34, y: oy + 60 },
    { x: ox + 76, y: oy + 54 },
    { x: ox + 76, y: oy + 100 },
    { x: ox + 34, y: oy + 106 },
  ], rgba('#25474b', 224));
  fillPolygon(atlas, [
    { x: ox + 76, y: oy + 54 },
    { x: ox + 94, y: oy + 62 },
    { x: ox + 94, y: oy + 108 },
    { x: ox + 76, y: oy + 100 },
  ], grime);
  fillRect(atlas, ox + 38, oy + 49, 38, 7, concrete);
  fillRect(atlas, ox + 80, oy + 76, 16, 16, rust);
};

const drawDoorCanopy = (frame) => {
  fillFrameBackground(frame);
  const ox = frame.col * cellSize;
  const oy = frame.row * cellSize;
  fillRect(atlas, ox + 60, oy + 52, 8, 52, slate);
  fillRect(atlas, ox + 42, oy + 34, 44, 10, brass);
  fillPolygon(atlas, [
    { x: ox + 34, y: oy + 44 },
    { x: ox + 92, y: oy + 36 },
    { x: ox + 86, y: oy + 56 },
    { x: ox + 40, y: oy + 62 },
  ], rust);
  fillEllipse(atlas, ox + 63, oy + 60, 36, 10, rgba('#57d4ff', 28));
  drawLine(atlas, ox + 48, oy + 32, ox + 82, oy + 26, cyan, 2);
};

const drawPuddleTile = (frame) => {
  const ox = frame.col * cellSize;
  const oy = frame.row * cellSize;
  fillEllipse(atlas, ox + 64, oy + 92, 32, 12, rgba('#2a6f92', 102));
  fillEllipse(atlas, ox + 56, oy + 88, 20, 8, rgba('#7ce9df', 44));
  fillEllipse(atlas, ox + 72, oy + 95, 12, 5, rgba('#b7f0ff', 52));
};

const drawGrateTile = (frame) => {
  const ox = frame.col * cellSize;
  const oy = frame.row * cellSize;
  fillDiamond(atlas, ox + 64, oy + 92, 48, 16, rgba('#273241', 148));
  for (let index = -2; index <= 2; index += 1) {
    drawLine(atlas, ox + 48 + index * 6, oy + 92 - 8, ox + 64 + index * 6, oy + 92 + 8, rgba('#7d8da5', 122), 0.8);
  }
  drawLine(atlas, ox + 48, oy + 92, ox + 80, oy + 92, rgba('#c0ccde', 96), 0.8);
};

const drawUtilityPatch = (frame) => {
  const ox = frame.col * cellSize;
  const oy = frame.row * cellSize;
  fillDiamond(atlas, ox + 64, oy + 92, 52, 18, rgba('#2b3344', 122));
  fillPolygon(atlas, [
    { x: ox + 42, y: oy + 86 },
    { x: ox + 72, y: oy + 80 },
    { x: ox + 86, y: oy + 94 },
    { x: ox + 56, y: oy + 100 },
  ], rgba('#4b5568', 190));
  drawLine(atlas, ox + 50, oy + 92, ox + 78, oy + 86, amber, 1.2);
  fillEllipse(atlas, ox + 54, oy + 90, 2.4, 2.4, concrete);
  fillEllipse(atlas, ox + 74, oy + 86, 2.4, 2.4, concrete);
};

const drawers = {
  street_lamp: drawStreetLamp,
  vending_kiosk: drawVendingKiosk,
  market_stall: drawMarketStall,
  barricade_cart: drawBarricadeCart,
  camera_mast: drawCameraMast,
  neon_panel: drawNeonPanel,
  bollards_cluster: drawBollards,
  dumpster_stack: drawDumpsterStack,
  door_canopy: drawDoorCanopy,
  puddle_tile: drawPuddleTile,
  grate_tile: drawGrateTile,
  utility_patch: drawUtilityPatch,
};

const encodePng = (buffer, width, height) => {
  const chunks = [];

  const appendChunk = (type, data) => {
    const chunk = Buffer.alloc(8 + data.length + 4);
    chunk.writeUInt32BE(data.length, 0);
    chunk.write(type, 4, 4, 'ascii');
    data.copy(chunk, 8);
    const crcBuffer = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    chunk.writeUInt32BE(crc32(crcBuffer), 8 + data.length);
    chunks.push(chunk);
  };

  const header = Buffer.from('\x89PNG\r\n\x1a\n', 'binary');
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  appendChunk('IHDR', ihdr);

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(buffer.subarray(y * stride, y * stride + stride)).copy(raw, y * (stride + 1) + 1);
  }
  appendChunk('IDAT', zlib.deflateSync(raw, { level: 9 }));
  appendChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ...chunks]);
};

const crcTable = new Uint32Array(256).map((_, index) => {
  let c = index;
  for (let k = 0; k < 8; k += 1) {
    c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c >>> 0;
});

const crc32 = (buffer) => {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const buildNormalAtlas = () => {
  for (let index = 0; index < atlas.length; index += 4) {
    const alpha = atlas[index + 3];
    if (alpha === 0) {
      continue;
    }

    normals[index] = 128;
    normals[index + 1] = 128;
    normals[index + 2] = 255;
    normals[index + 3] = alpha;
  }
};

const atlasJson = {
  frames: Object.fromEntries(
    frames.map((frame) => [
      frame.id,
      {
        frame: {
          x: frame.col * cellSize,
          y: frame.row * cellSize,
          w: cellSize,
          h: cellSize,
        },
        rotated: false,
        trimmed: false,
        spriteSourceSize: { x: 0, y: 0, w: cellSize, h: cellSize },
        sourceSize: { w: cellSize, h: cellSize },
        pivot: frame.pivot,
      },
    ])
  ),
  meta: {
    app: 'Codex Level0 Atlas Generator',
    version: '1.0',
    image: 'level0_environment.png',
    format: 'RGBA8888',
    size: { w: atlasWidth, h: atlasHeight },
    scale: '1',
  },
};

frames.forEach((frame) => {
  const draw = drawers[frame.id];
  if (draw) {
    draw(frame);
  }
});

buildNormalAtlas();

const atlasesDir = path.join(projectRoot, 'public', 'atlases');
const normalsDir = path.join(projectRoot, 'public', 'normals');

await fs.mkdir(atlasesDir, { recursive: true });
await fs.mkdir(normalsDir, { recursive: true });

await fs.writeFile(path.join(atlasesDir, 'level0_environment.png'), encodePng(atlas, atlasWidth, atlasHeight));
await fs.writeFile(path.join(normalsDir, 'level0_environment_n.png'), encodePng(normals, atlasWidth, atlasHeight));
await fs.writeFile(path.join(atlasesDir, 'level0_environment.json'), JSON.stringify(atlasJson, null, 2));

console.log('Generated level0 environment atlas.');

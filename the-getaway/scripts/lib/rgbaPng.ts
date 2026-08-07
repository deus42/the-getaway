import crypto from 'node:crypto';
import zlib from 'node:zlib';

export interface RgbaImage {
  width: number;
  height: number;
  data: Uint8Array;
}

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

export const encodeRgbaPng = (image: RgbaImage): Buffer => {
  const expectedLength = image.width * image.height * 4;
  if (image.data.length !== expectedLength) {
    throw new Error(`RGBA buffer has ${image.data.length} bytes; expected ${expectedLength}`);
  }

  const stride = image.width * 4;
  const raw = Buffer.alloc((stride + 1) * image.height);
  for (let row = 0; row < image.height; row += 1) {
    const rawOffset = row * (stride + 1);
    raw[rawOffset] = 0;
    Buffer.from(image.data.buffer, image.data.byteOffset + row * stride, stride).copy(
      raw,
      rawOffset + 1
    );
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(image.width, 0);
  ihdr.writeUInt32BE(image.height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    PNG_SIGNATURE,
    writeChunk('IHDR', ihdr),
    writeChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    writeChunk('IEND', Buffer.alloc(0)),
  ]);
};

const paethPredictor = (left: number, up: number, upperLeft: number): number => {
  const estimate = left + up - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= upDistance && leftDistance <= upperLeftDistance) return left;
  if (upDistance <= upperLeftDistance) return up;
  return upperLeft;
};

export const decodeRgbaPng = (buffer: Buffer): RgbaImage => {
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('Invalid PNG signature');
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat: Buffer[] = [];

  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > buffer.length) throw new Error(`Truncated PNG chunk ${type}`);
    const data = buffer.subarray(dataStart, dataEnd);

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      if (data[12] !== 0) throw new Error('Interlaced PNGs are not supported');
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset = dataEnd + 4;
  }

  if (width <= 0 || height <= 0 || bitDepth !== 8 || ![2, 4, 6].includes(colorType)) {
    throw new Error(`Unsupported PNG header ${width}x${height}, depth ${bitDepth}, color ${colorType}`);
  }

  const bytesPerPixel = colorType === 6 ? 4 : colorType === 2 ? 3 : 2;
  const stride = width * bytesPerPixel;
  const inflated = zlib.inflateSync(Buffer.concat(idat));
  if (inflated.length !== (stride + 1) * height) {
    throw new Error(`Unexpected inflated PNG size ${inflated.length}`);
  }

  const reconstructed = Buffer.alloc(stride * height);
  for (let row = 0; row < height; row += 1) {
    const sourceOffset = row * (stride + 1);
    const filter = inflated[sourceOffset];
    for (let column = 0; column < stride; column += 1) {
      const rawValue = inflated[sourceOffset + 1 + column];
      const targetOffset = row * stride + column;
      const left = column >= bytesPerPixel ? reconstructed[targetOffset - bytesPerPixel] : 0;
      const up = row > 0 ? reconstructed[targetOffset - stride] : 0;
      const upperLeft =
        row > 0 && column >= bytesPerPixel
          ? reconstructed[targetOffset - stride - bytesPerPixel]
          : 0;
      let value: number;
      switch (filter) {
        case 0:
          value = rawValue;
          break;
        case 1:
          value = rawValue + left;
          break;
        case 2:
          value = rawValue + up;
          break;
        case 3:
          value = rawValue + Math.floor((left + up) / 2);
          break;
        case 4:
          value = rawValue + paethPredictor(left, up, upperLeft);
          break;
        default:
          throw new Error(`Unsupported PNG filter ${filter}`);
      }
      reconstructed[targetOffset] = value & 0xff;
    }
  }

  if (colorType === 6) {
    return { width, height, data: new Uint8Array(reconstructed) };
  }

  const rgba = new Uint8Array(width * height * 4);
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    if (colorType === 2) {
      rgba[pixel * 4] = reconstructed[pixel * 3];
      rgba[pixel * 4 + 1] = reconstructed[pixel * 3 + 1];
      rgba[pixel * 4 + 2] = reconstructed[pixel * 3 + 2];
      rgba[pixel * 4 + 3] = 255;
    } else {
      const gray = reconstructed[pixel * 2];
      rgba[pixel * 4] = gray;
      rgba[pixel * 4 + 1] = gray;
      rgba[pixel * 4 + 2] = gray;
      rgba[pixel * 4 + 3] = reconstructed[pixel * 2 + 1];
    }
  }
  return { width, height, data: rgba };
};

export const resizeRgbaBox = (
  source: RgbaImage,
  targetWidth: number,
  targetHeight: number
): RgbaImage => {
  if (source.width % targetWidth !== 0 || source.height % targetHeight !== 0) {
    throw new Error(
      `Box resize requires integer factors: ${source.width}x${source.height} -> ${targetWidth}x${targetHeight}`
    );
  }
  const factorX = source.width / targetWidth;
  const factorY = source.height / targetHeight;
  const output = new Uint8Array(targetWidth * targetHeight * 4);
  const sampleCount = factorX * factorY;

  for (let targetY = 0; targetY < targetHeight; targetY += 1) {
    for (let targetX = 0; targetX < targetWidth; targetX += 1) {
      let alphaSum = 0;
      let redPremultiplied = 0;
      let greenPremultiplied = 0;
      let bluePremultiplied = 0;
      for (let sourceY = targetY * factorY; sourceY < (targetY + 1) * factorY; sourceY += 1) {
        for (let sourceX = targetX * factorX; sourceX < (targetX + 1) * factorX; sourceX += 1) {
          const sourceOffset = (sourceY * source.width + sourceX) * 4;
          const alpha = source.data[sourceOffset + 3];
          alphaSum += alpha;
          redPremultiplied += source.data[sourceOffset] * alpha;
          greenPremultiplied += source.data[sourceOffset + 1] * alpha;
          bluePremultiplied += source.data[sourceOffset + 2] * alpha;
        }
      }

      const targetOffset = (targetY * targetWidth + targetX) * 4;
      output[targetOffset + 3] = Math.round(alphaSum / sampleCount);
      if (alphaSum > 0) {
        output[targetOffset] = Math.round(redPremultiplied / alphaSum);
        output[targetOffset + 1] = Math.round(greenPremultiplied / alphaSum);
        output[targetOffset + 2] = Math.round(bluePremultiplied / alphaSum);
      }
    }
  }

  return { width: targetWidth, height: targetHeight, data: output };
};

export const resizeRgbaBilinear = (
  source: RgbaImage,
  targetWidth: number,
  targetHeight: number
): RgbaImage => {
  const output = new Uint8Array(targetWidth * targetHeight * 4);
  for (let targetY = 0; targetY < targetHeight; targetY += 1) {
    const sourceY = ((targetY + 0.5) * source.height) / targetHeight - 0.5;
    const y0 = Math.max(0, Math.floor(sourceY));
    const y1 = Math.min(source.height - 1, y0 + 1);
    const fy = Math.max(0, sourceY - y0);
    for (let targetX = 0; targetX < targetWidth; targetX += 1) {
      const sourceX = ((targetX + 0.5) * source.width) / targetWidth - 0.5;
      const x0 = Math.max(0, Math.floor(sourceX));
      const x1 = Math.min(source.width - 1, x0 + 1);
      const fx = Math.max(0, sourceX - x0);
      const weights = [
        { x: x0, y: y0, weight: (1 - fx) * (1 - fy) },
        { x: x1, y: y0, weight: fx * (1 - fy) },
        { x: x0, y: y1, weight: (1 - fx) * fy },
        { x: x1, y: y1, weight: fx * fy },
      ];
      let alpha = 0;
      let red = 0;
      let green = 0;
      let blue = 0;
      for (const sample of weights) {
        const offset = (sample.y * source.width + sample.x) * 4;
        const sampleAlpha = source.data[offset + 3] / 255;
        const weightedAlpha = sampleAlpha * sample.weight;
        alpha += weightedAlpha;
        red += source.data[offset] * weightedAlpha;
        green += source.data[offset + 1] * weightedAlpha;
        blue += source.data[offset + 2] * weightedAlpha;
      }
      const targetOffset = (targetY * targetWidth + targetX) * 4;
      output[targetOffset + 3] = Math.round(alpha * 255);
      if (alpha > 0) {
        output[targetOffset] = Math.round(red / alpha);
        output[targetOffset + 1] = Math.round(green / alpha);
        output[targetOffset + 2] = Math.round(blue / alpha);
      }
    }
  }
  return { width: targetWidth, height: targetHeight, data: output };
};

export const sha256Hex = (buffer: Uint8Array): string =>
  crypto.createHash('sha256').update(buffer).digest('hex');

export interface AlphaMeasurement {
  alphaBounds: { x: number; y: number; width: number; height: number };
  alphaPixelCount: number;
  footContactRowPx: number;
}

export interface AlphaComponent extends AlphaMeasurement {
  pixelIndices: number[];
}

export const findAlphaComponents = (
  image: RgbaImage,
  alphaThreshold = 8
): AlphaComponent[] => {
  const visited = new Uint8Array(image.width * image.height);
  const components: AlphaComponent[] = [];

  for (let startY = 0; startY < image.height; startY += 1) {
    for (let startX = 0; startX < image.width; startX += 1) {
      const startIndex = startY * image.width + startX;
      if (
        visited[startIndex] === 1 ||
        image.data[startIndex * 4 + 3] < alphaThreshold
      ) {
        continue;
      }

      const queue = [startIndex];
      const pixelIndices: number[] = [];
      visited[startIndex] = 1;
      let minX = startX;
      let minY = startY;
      let maxX = startX;
      let maxY = startY;

      for (let queueIndex = 0; queueIndex < queue.length; queueIndex += 1) {
        const pixelIndex = queue[queueIndex];
        const x = pixelIndex % image.width;
        const y = Math.floor(pixelIndex / image.width);
        pixelIndices.push(pixelIndex);
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);

        for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
          for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
            if (offsetX === 0 && offsetY === 0) continue;
            const neighborX = x + offsetX;
            const neighborY = y + offsetY;
            if (
              neighborX < 0 ||
              neighborX >= image.width ||
              neighborY < 0 ||
              neighborY >= image.height
            ) {
              continue;
            }
            const neighborIndex = neighborY * image.width + neighborX;
            if (
              visited[neighborIndex] === 1 ||
              image.data[neighborIndex * 4 + 3] < alphaThreshold
            ) {
              continue;
            }
            visited[neighborIndex] = 1;
            queue.push(neighborIndex);
          }
        }
      }

      components.push({
        alphaBounds: {
          x: minX,
          y: minY,
          width: maxX - minX + 1,
          height: maxY - minY + 1,
        },
        alphaPixelCount: pixelIndices.length,
        footContactRowPx: maxY,
        pixelIndices,
      });
    }
  }

  return components;
};

export const extractAlphaComponent = (
  source: RgbaImage,
  component: AlphaComponent
): RgbaImage => {
  const { x, y, width, height } = component.alphaBounds;
  if (width <= 0 || height <= 0 || component.pixelIndices.length === 0) {
    throw new Error('Cannot extract an empty alpha component');
  }
  const output: RgbaImage = {
    width,
    height,
    data: new Uint8Array(width * height * 4),
  };
  for (const pixelIndex of component.pixelIndices) {
    const sourceX = pixelIndex % source.width;
    const sourceY = Math.floor(pixelIndex / source.width);
    const sourceOffset = pixelIndex * 4;
    const targetOffset = ((sourceY - y) * width + (sourceX - x)) * 4;
    output.data.set(source.data.subarray(sourceOffset, sourceOffset + 4), targetOffset);
  }
  return output;
};

export const measureAlpha = (image: RgbaImage, alphaThreshold = 8): AlphaMeasurement => {
  let minX = image.width;
  let minY = image.height;
  let maxX = -1;
  let maxY = -1;
  let alphaPixelCount = 0;
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      if (image.data[(y * image.width + x) * 4 + 3] < alphaThreshold) continue;
      alphaPixelCount += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) {
    return {
      alphaBounds: { x: 0, y: 0, width: 0, height: 0 },
      alphaPixelCount: 0,
      footContactRowPx: -1,
    };
  }

  return {
    alphaBounds: {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    },
    alphaPixelCount,
    footContactRowPx: maxY,
  };
};

export const extractRgbaRegion = (
  source: RgbaImage,
  x: number,
  y: number,
  width: number,
  height: number
): RgbaImage => {
  const data = new Uint8Array(width * height * 4);
  for (let row = 0; row < height; row += 1) {
    const sourceStart = ((y + row) * source.width + x) * 4;
    const targetStart = row * width * 4;
    data.set(source.data.subarray(sourceStart, sourceStart + width * 4), targetStart);
  }
  return { width, height, data };
};

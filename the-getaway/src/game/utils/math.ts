export const clamp = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) {
    return min;
  }

  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
};

export const wrapDegrees = (angle: number): number => {
  if (!Number.isFinite(angle)) {
    return 0;
  }

  const wrapped = angle % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
};

export const shortestAngleBetween = (start: number, end: number): number => {
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return 0;
  }

  return ((end - start + 540) % 360) - 180;
};

export const lerp = (start: number, end: number, t: number): number => {
  if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(t)) {
    return start;
  }

  return start + (end - start) * t;
};

export const radiansToDegrees = (radians: number): number => {
  if (!Number.isFinite(radians)) {
    return 0;
  }

  return radians * (180 / Math.PI);
};

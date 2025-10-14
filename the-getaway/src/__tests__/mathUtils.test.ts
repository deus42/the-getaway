import { clamp, wrapDegrees, shortestAngleBetween, lerp, radiansToDegrees } from '../game/utils/math';

describe('math utils', () => {
  describe('clamp', () => {
    it('returns min when value is below', () => {
      expect(clamp(-10, 0, 5)).toBe(0);
    });

    it('returns max when value is above', () => {
      expect(clamp(10, 0, 5)).toBe(5);
    });

    it('returns value when within range', () => {
      expect(clamp(3, 0, 5)).toBe(3);
    });

    it('falls back to min for non-finite numbers', () => {
      expect(clamp(Number.NaN, 0, 5)).toBe(0);
      expect(clamp(Number.POSITIVE_INFINITY, 0, 5)).toBe(0);
    });
  });

  describe('wrapDegrees', () => {
    it('wraps negative angles into positive range', () => {
      expect(wrapDegrees(-90)).toBe(270);
    });

    it('wraps angles greater than 360', () => {
      expect(wrapDegrees(450)).toBe(90);
    });

    it('returns zero for non-finite input', () => {
      expect(wrapDegrees(Number.NaN)).toBe(0);
    });
  });

  describe('shortestAngleBetween', () => {
    it('returns smallest difference', () => {
      expect(shortestAngleBetween(10, 350)).toBe(-20);
      expect(shortestAngleBetween(350, 10)).toBe(20);
    });

    it('returns zero for non-finite inputs', () => {
      expect(shortestAngleBetween(Number.NaN, 10)).toBe(0);
    });
  });

  describe('lerp', () => {
    it('linearly interpolates values', () => {
      expect(lerp(0, 10, 0.5)).toBe(5);
    });

    it('returns start for invalid input', () => {
      expect(lerp(5, 10, Number.NaN)).toBe(5);
    });
  });

  describe('radiansToDegrees', () => {
    it('converts radians to degrees', () => {
      expect(radiansToDegrees(Math.PI)).toBeCloseTo(180);
    });

    it('returns zero for invalid input', () => {
      expect(radiansToDegrees(Number.NaN)).toBe(0);
    });
  });
});

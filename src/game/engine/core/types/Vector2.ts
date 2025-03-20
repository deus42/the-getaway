/**
 * Vector2 type for 2D coordinates and vectors
 */

export interface Vector2 {
  x: number;
  y: number;
}

/**
 * Create a new Vector2
 * @param x X coordinate
 * @param y Y coordinate
 * @returns A new Vector2 object
 */
export function createVector2(x: number = 0, y: number = 0): Vector2 {
  return { x, y };
}

/**
 * Add two vectors
 * @param a First vector
 * @param b Second vector
 * @returns A new vector with the sum
 */
export function addVectors(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

/**
 * Subtract vector b from vector a
 * @param a First vector
 * @param b Second vector
 * @returns A new vector with the difference
 */
export function subtractVectors(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

/**
 * Multiply a vector by a scalar
 * @param v Vector to multiply
 * @param scalar Scalar value
 * @returns A new scaled vector
 */
export function multiplyVector(v: Vector2, scalar: number): Vector2 {
  return { x: v.x * scalar, y: v.y * scalar };
}

/**
 * Calculate the distance between two vectors
 * @param a First vector
 * @param b Second vector
 * @returns Distance between the vectors
 */
export function distance(a: Vector2, b: Vector2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate the magnitude (length) of a vector
 * @param v Vector
 * @returns Magnitude of the vector
 */
export function magnitude(v: Vector2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * Normalize a vector (set its length to 1)
 * @param v Vector to normalize
 * @returns A new normalized vector
 */
export function normalize(v: Vector2): Vector2 {
  const mag = magnitude(v);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: v.x / mag, y: v.y / mag };
}

/**
 * Calculate the dot product of two vectors
 * @param a First vector
 * @param b Second vector
 * @returns Dot product value
 */
export function dotProduct(a: Vector2, b: Vector2): number {
  return a.x * b.x + a.y * b.y;
}

/**
 * Create a vector from an angle (in radians) and magnitude
 * @param angle Angle in radians
 * @param magnitude Length of the vector
 * @returns A new vector
 */
export function fromAngle(angle: number, magnitude: number = 1): Vector2 {
  return {
    x: Math.cos(angle) * magnitude,
    y: Math.sin(angle) * magnitude
  };
}

/**
 * Calculate the angle of a vector in radians
 * @param v Vector
 * @returns Angle in radians
 */
export function getAngle(v: Vector2): number {
  return Math.atan2(v.y, v.x);
}

/**
 * Interpolate between two vectors
 * @param a Starting vector
 * @param b Ending vector
 * @param t Interpolation factor (0-1)
 * @returns Interpolated vector
 */
export function lerp(a: Vector2, b: Vector2, t: number): Vector2 {
  t = Math.max(0, Math.min(1, t)); // Clamp t to 0-1
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t
  };
}

/**
 * Check if two vectors are equal
 * @param a First vector
 * @param b Second vector
 * @param epsilon Small value for floating point comparison
 * @returns True if vectors are equal
 */
export function equals(a: Vector2, b: Vector2, epsilon: number = 0.0001): boolean {
  return Math.abs(a.x - b.x) < epsilon && Math.abs(a.y - b.y) < epsilon;
} 
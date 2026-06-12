import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

/**
 * Hash a plaintext password using scrypt with a random salt.
 * Returns a string in the format "salt:hash" (both hex-encoded).
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify a plaintext password against a stored "salt:hash" string.
 */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const hashBuffer = Buffer.from(hash, "hex");
  const candidateBuffer = scryptSync(password, salt, 64);

  if (hashBuffer.length !== candidateBuffer.length) return false;
  return timingSafeEqual(hashBuffer, candidateBuffer);
}

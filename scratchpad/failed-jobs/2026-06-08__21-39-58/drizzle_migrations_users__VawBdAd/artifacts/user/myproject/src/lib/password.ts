const ITERATIONS = 100_000;
const KEY_LENGTH_BITS = 256;
const HASH_ALGORITHM = "SHA-256";

/**
 * Hash a password using PBKDF2 with a random salt.
 * Returns a string in the format: iterations:salt_base64:hash_base64
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await deriveKey(password, salt, ITERATIONS, KEY_LENGTH_BITS);
  const hashBytes = new Uint8Array(hash);
  return `${ITERATIONS}:${bytesToBase64(salt)}:${bytesToBase64(hashBytes)}`;
}

/**
 * Verify a password against a stored hash string.
 * The stored hash must be in the format: iterations:salt_base64:hash_base64
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const parts = storedHash.split(":");
  if (parts.length !== 3) return false;

  const iterations = parseInt(parts[0], 10);
  if (isNaN(iterations)) return false;

  const salt = base64ToBytes(parts[1]);
  const expectedHash = base64ToBytes(parts[2]);

  const derivedKey = await deriveKey(password, salt, iterations, expectedHash.length * 8);
  const derivedBytes = new Uint8Array(derivedKey);

  return timingSafeEqual(derivedBytes, expectedHash);
}

async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
  keyLengthBits: number
): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  return crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: HASH_ALGORITHM,
    },
    passwordKey,
    keyLengthBits
  );
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

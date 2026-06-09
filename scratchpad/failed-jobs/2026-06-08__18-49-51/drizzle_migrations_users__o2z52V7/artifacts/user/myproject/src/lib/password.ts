const ITERATIONS = 100_000;
const HASH_LENGTH = 32; // bytes
const SALT_LENGTH = 16; // bytes

/**
 * Hash a plain-text password with PBKDF2/SHA-256.
 * Returns a base64-encoded string: "<salt_hex>:<hash_hex>"
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: ITERATIONS,
    },
    keyMaterial,
    HASH_LENGTH * 8
  );

  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${saltHex}:${hashHex}`;
}

/**
 * Verify a plain-text password against a stored hash string.
 * The stored string has the format "<salt_hex>:<hash_hex>".
 */
export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [saltHex, storedHashHex] = stored.split(":");
  if (!saltHex || !storedHashHex) return false;

  const salt = new Uint8Array(
    saltHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
  );

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: ITERATIONS,
    },
    keyMaterial,
    HASH_LENGTH * 8
  );

  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex === storedHashHex;
}

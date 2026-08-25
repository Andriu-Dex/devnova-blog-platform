import { hash, verify } from "@node-rs/argon2";

const ARGON2_CONFIG = {
  memoryCost: 19456, // 19456 KiB
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
  // Note: @node-rs/argon2 defaults to Argon2id and v19 automatically, 
  // but if explicit options exist in the future for algorithm, we'd specify them here.
};

/**
 * Validates a password before hashing.
 * Rules:
 * - min 12 characters
 * - max 128 characters
 * - no empty string
 */
export function validatePasswordForHashing(password: string): void {
  if (typeof password !== "string") {
    throw new Error("La contraseña debe ser una cadena de texto.");
  }
  if (password.length < 12) {
    throw new Error("La contraseña debe tener un mínimo de 12 caracteres.");
  }
  if (password.length > 128) {
    throw new Error("La contraseña debe tener un máximo de 128 caracteres.");
  }
}

/**
 * Hashes a password using Argon2id.
 */
export async function hashPassword(password: string): Promise<string> {
  validatePasswordForHashing(password);
  return await hash(password, ARGON2_CONFIG);
}

export async function verifyPassword(hashString: string, password: string): Promise<boolean> {
  if (typeof password !== "string" || password.length === 0) {
    return false;
  }
  try {
    return await verify(hashString, password);
  } catch (error) {
    throw error;
  }
}

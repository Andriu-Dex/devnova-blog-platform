import "server-only";
import crypto from "node:crypto";

/**
 * Genera un token aleatorio opaco de 256 bits (32 bytes) codificado en base64url.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Transforma el token utilizando SHA-256 para almacenarlo de forma segura en PostgreSQL.
 * @param token Token original devuelto por generateSessionToken.
 * @returns Hash hexadecimal estable del token.
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

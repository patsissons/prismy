import type { OAuthScope } from "../shared/types";

export const SESSION_COOKIE = "prismy_session";
export const STATE_COOKIE = "prismy_oauth_state";
export const SESSION_MAX_AGE = 30 * 24 * 3600;
export const STATE_MAX_AGE = 10 * 60;

export interface SessionPayload {
  token: string;
  scope: OAuthScope;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function key(secret: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function fromBase64Url(text: string): Uint8Array | null {
  try {
    const padded = text.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

/** AES-GCM seals the payload; the cookie carries iv || ciphertext. */
export async function sealSession(
  secret: string,
  payload: SessionPayload,
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await key(secret),
    encoder.encode(JSON.stringify(payload)),
  );
  const sealed = new Uint8Array(iv.length + ciphertext.byteLength);
  sealed.set(iv);
  sealed.set(new Uint8Array(ciphertext), iv.length);
  return toBase64Url(sealed);
}

/** Null for a missing, tampered or foreign-key cookie. */
export async function openSession(
  secret: string,
  sealed: string | undefined,
): Promise<SessionPayload | null> {
  if (!sealed) return null;
  const bytes = fromBase64Url(sealed);
  if (!bytes || bytes.length <= 12) return null;
  try {
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: bytes.slice(0, 12) },
      await key(secret),
      bytes.slice(12),
    );
    const payload = JSON.parse(
      decoder.decode(plain),
    ) as Partial<SessionPayload>;
    if (typeof payload.token !== "string") return null;
    return {
      token: payload.token,
      scope: payload.scope === "private" ? "private" : "public",
    };
  } catch {
    return null;
  }
}

export function parseCookies(header: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const part of header?.split(";") ?? []) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    cookies[part.slice(0, index).trim()] = part.slice(index + 1).trim();
  }
  return cookies;
}

export function cookieHeader(
  name: string,
  value: string,
  options: { maxAge: number; secure: boolean },
): string {
  const parts = [
    `${name}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${options.maxAge}`,
  ];
  if (options.secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearCookieHeader(name: string, secure: boolean): string {
  return cookieHeader(name, "", { maxAge: 0, secure });
}

export function randomToken(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

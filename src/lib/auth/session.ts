import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "silkworm_session";
const ALG = "HS256";
export const SESSION_TTL_SEC = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
  userId: string;
  email: string;
  name: string | null;
  image: string | null;
};

function secret(): Uint8Array | null {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) return null; // strict: no auth without a real secret
  return new TextEncoder().encode(s);
}

export async function signSession(
  payload: SessionPayload,
): Promise<string | null> {
  const k = secret();
  if (!k) return null;
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SEC}s`)
    .sign(k);
}

export async function verifySession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  const k = secret();
  if (!k) return null;
  try {
    const { payload } = await jwtVerify(token, k, { algorithms: [ALG] });
    if (typeof payload !== "object" || !payload) return null;
    const p = payload as Record<string, unknown>;
    if (typeof p.userId !== "string" || typeof p.email !== "string")
      return null;
    return {
      userId: p.userId,
      email: p.email,
      name: (p.name as string | null | undefined) ?? null,
      image: (p.image as string | null | undefined) ?? null,
    };
  } catch {
    return null;
  }
}

// Read session from a NextRequest's cookies (for middleware) or server-side `cookies()` API.
export async function getSessionFromRequest(
  req: NextRequest,
): Promise<SessionPayload | null> {
  return verifySession(req.cookies.get(SESSION_COOKIE)?.value);
}

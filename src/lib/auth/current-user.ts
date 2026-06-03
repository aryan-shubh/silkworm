import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession, type SessionPayload } from "./session";

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getComposio } from "@/lib/auth/composio";
import { signSession, SESSION_COOKIE, SESSION_TTL_SEC } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";

const ATTEMPT_COOKIE = "silkworm_oauth_attempt";
const WAIT_TIMEOUT_MS = 30_000;

type AttemptState = {
  preAuthUserId: string;
  connectionId: string;
  returnTo: string;
};

type GithubUser = {
  email?: string | null;
  name?: string | null;
  login?: string | null;
  avatar_url?: string | null;
  id?: number | null;
};

function redirectTo(url: string, res?: NextResponse): NextResponse {
  const r = NextResponse.redirect(url);
  r.cookies.set(ATTEMPT_COOKIE, "", { maxAge: 0, path: "/" });
  return r;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  // 1. Read attempt cookie
  const raw = req.cookies.get(ATTEMPT_COOKIE)?.value;
  if (!raw) {
    return NextResponse.redirect(
      new URL("/sign-in?error=missing_attempt", req.nextUrl.origin),
    );
  }

  let attempt: AttemptState;
  try {
    attempt = JSON.parse(raw) as AttemptState;
    if (!attempt.connectionId || !attempt.preAuthUserId) throw new Error();
  } catch {
    return redirectTo(
      new URL("/sign-in?error=missing_attempt", req.nextUrl.origin).toString(),
    );
  }

  const composio = getComposio();
  if (!composio) {
    return redirectTo(
      new URL("/sign-in?error=auth_not_configured", req.nextUrl.origin).toString(),
    );
  }

  // 2. Wait for the connection to be established
  let connectedAccount: Awaited<
    ReturnType<typeof composio.connectedAccounts.waitForConnection>
  >;
  try {
    connectedAccount = await composio.connectedAccounts.waitForConnection(
      attempt.connectionId,
      WAIT_TIMEOUT_MS,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    const isTimeout = msg.toLowerCase().includes("timeout");
    const errorParam = isTimeout ? "timeout" : "connection_failed";
    return redirectTo(
      new URL(
        `/sign-in?error=${errorParam}`,
        req.nextUrl.origin,
      ).toString(),
    );
  }

  // 3. Fetch the GitHub user via proxy
  let ghUser: GithubUser;
  try {
    const proxyRes = await composio.tools.proxyExecute({
      endpoint: "/user",
      method: "GET",
      connectedAccountId: connectedAccount.id,
    });
    ghUser = (proxyRes.data ?? {}) as GithubUser;
  } catch {
    return redirectTo(
      new URL("/sign-in?error=github_fetch_failed", req.nextUrl.origin).toString(),
    );
  }

  // GitHub may omit email when user has email privacy enabled
  const email = ghUser.email;
  if (!email) {
    return redirectTo(
      new URL("/sign-in?error=no_email", req.nextUrl.origin).toString(),
    );
  }

  const name = ghUser.name ?? ghUser.login ?? null;
  const image = ghUser.avatar_url ?? null;

  // 4. Upsert user into DB
  const db = getDb();
  let userId: string;

  try {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      userId = existing.id;
      await db
        .update(users)
        .set({
          name: name ?? undefined,
          image: image ?? undefined,
          composioUserId: attempt.preAuthUserId,
          emailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    } else {
      userId = crypto.randomUUID();
      await db.insert(users).values({
        id: userId,
        email,
        emailVerified: true,
        name,
        image,
        composioUserId: attempt.preAuthUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  } catch {
    return redirectTo(
      new URL("/sign-in?error=db_error", req.nextUrl.origin).toString(),
    );
  }

  // 5. Sign the session JWT
  const token = await signSession({ userId, email, name, image });
  if (!token) {
    return redirectTo(
      new URL("/sign-in?error=session_secret_missing", req.nextUrl.origin).toString(),
    );
  }

  // 6. Set session cookie, clear attempt cookie, redirect
  const isProduction = process.env.NODE_ENV === "production";
  const returnTo = attempt.returnTo || "/dashboard";
  const response = NextResponse.redirect(
    new URL(returnTo, req.nextUrl.origin),
  );

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: SESSION_TTL_SEC,
    path: "/",
  });

  response.cookies.set(ATTEMPT_COOKIE, "", { maxAge: 0, path: "/" });

  return response;
}

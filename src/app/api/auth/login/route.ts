import { NextRequest, NextResponse } from "next/server";
import { getComposio, getGithubAuthConfigId } from "@/lib/auth/composio";

const ATTEMPT_COOKIE = "silkworm_oauth_attempt";
const ATTEMPT_TTL_SEC = 600; // 10 minutes

type AttemptState = {
  preAuthUserId: string;
  connectionId: string;
  returnTo: string;
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  const composio = getComposio();
  const authConfigId = getGithubAuthConfigId();

  if (!composio || !authConfigId) {
    return NextResponse.json(
      { error: "auth not configured" },
      { status: 503 },
    );
  }

  let returnTo = "/dashboard";
  try {
    const body = await req.json();
    if (typeof body?.returnTo === "string" && body.returnTo.startsWith("/")) {
      returnTo = body.returnTo;
    }
  } catch {
    // malformed body — use default returnTo
  }

  const origin = req.nextUrl.origin;
  const callbackUrl = `${origin}/api/auth/callback`;
  const preAuthUserId = crypto.randomUUID();

  try {
    const connRequest = await composio.connectedAccounts.link(
      preAuthUserId,
      authConfigId,
      { callbackUrl },
    );

    const redirectUrl = connRequest.redirectUrl;
    if (!redirectUrl) {
      return NextResponse.json(
        { error: "composio did not return a redirect URL" },
        { status: 502 },
      );
    }

    const attempt: AttemptState = {
      preAuthUserId,
      connectionId: connRequest.id,
      returnTo,
    };

    const res = NextResponse.json({
      redirectUrl,
      connectionId: connRequest.id,
    });

    res.cookies.set(ATTEMPT_COOKIE, JSON.stringify(attempt), {
      httpOnly: true,
      sameSite: "lax",
      maxAge: ATTEMPT_TTL_SEC,
      path: "/",
    });

    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: `failed to initiate OAuth: ${message}` },
      { status: 502 },
    );
  }
}

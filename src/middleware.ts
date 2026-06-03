import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";

export const config = {
  matcher: ["/dashboard/:path*"],
  runtime: "nodejs",
};

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(req);
  if (!session) {
    const returnTo = encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(
      new URL(`/sign-in?returnTo=${returnTo}`, req.nextUrl.origin),
      { status: 307 },
    );
  }
  return NextResponse.next();
}

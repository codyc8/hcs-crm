import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, storeRefreshToken } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL("/settings/google-calendar?error=access_denied", request.url)
    );
  }

  try {
    const { refresh_token } = await exchangeCodeForTokens(code);
    await storeRefreshToken(refresh_token);
    return NextResponse.redirect(
      new URL("/settings/google-calendar?connected=true", request.url)
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "OAuth error";
    return NextResponse.redirect(
      new URL(
        `/settings/google-calendar?error=${encodeURIComponent(msg)}`,
        request.url
      )
    );
  }
}

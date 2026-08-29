import { NextResponse, type NextRequest } from "next/server";
import { getStaffPrincipal } from "@exporthq/auth";

/** First operations boundary. Pages still authenticate and authorize again;
 * Proxy prevents anonymous/customer-only traffic from reaching render code. */
export async function proxy(request: NextRequest) {
  try {
    await getStaffPrincipal(request);
    return NextResponse.next();
  } catch {
    return new NextResponse("Staff authentication with strong verification is required.", {
      status: 401,
      headers: { "cache-control": "no-store" }
    });
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp)$).*)"]
};

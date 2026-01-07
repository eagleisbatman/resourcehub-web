import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware() {
  // Simple middleware - let NextAuth handle auth in routes
  // NextAuth v5 beta handles auth differently
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)"],
};


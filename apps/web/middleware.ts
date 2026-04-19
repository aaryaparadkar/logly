import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png).*)",
  ],
};

export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

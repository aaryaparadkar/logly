import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png).*)",
  ],
};

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host");

  if (!host) {
    return NextResponse.next();
  }

  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "logly.app";
  const isCustomDomain =
    !host.includes(baseDomain) &&
    !host.includes("localhost:3000") &&
    !host.includes("localhost:3001");

  if (!isCustomDomain) {
    return NextResponse.next();
  }

  try {
    const domainMapping = await getDomainMapping(host);

    if (domainMapping) {
      const { owner, repo } = domainMapping;
      const url = new URL(request.url);
      const newUrl = new URL(`/r/${owner}/${repo}${url.pathname}`, request.url);

      return NextResponse.rewrite(newUrl);
    }
  } catch (error) {
    console.error("Custom domain lookup failed:", error);
  }

  return NextResponse.next();
}

async function getDomainMapping(domain: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  try {
    const response = await fetch(`${apiUrl}/api/custom-domains/${domain}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch domain mapping:", error);
    return null;
  }
}

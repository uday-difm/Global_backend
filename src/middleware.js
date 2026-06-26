import { NextResponse } from "next/server";

/** Path prefixes that should never be blocked by maintenance mode */
const SKIP_PREFIXES = ["/api/", "/maintenance", "/_next"];

/** Static file extensions to skip maintenance check for */
const STATIC_EXTENSIONS = [
  ".js",
  ".css",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".ico",
  ".webp",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".json",
  ".txt",
  ".xml",
];

function shouldSkipMaintenanceCheck(pathname) {
  if (SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }
  if (STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
    return true;
  }
  if (pathname === "/favicon.ico") return true;
  return false;
}

export async function middleware(request) {
  const origin = request.headers.get("origin") || "*";
  const url = new URL(request.url);
  const pathname = url.pathname;

  // --------------- CORS handling (API routes only) ---------------
  if (pathname.startsWith("/api/")) {
    if (request.method === "OPTIONS") {
      const preflightHeaders = {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods":
          "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, x-site-id, x-integration-key, x-requested-with",
        "Access-Control-Max-Age": "86400",
      };
      return new NextResponse(null, {
        status: 204,
        headers: preflightHeaders,
      });
    }

    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-site-id, x-integration-key, x-requested-with",
    );
    return response;
  }

  // --------------- Maintenance mode check (public pages only) ---------------
  if (shouldSkipMaintenanceCheck(pathname)) {
    return NextResponse.next();
  }

  // Determine siteId from request (header or query param)
  const siteId =
    request.headers.get("x-site-id") || url.searchParams.get("siteId");

  if (!siteId) {
    // No site context available - pass through
    return NextResponse.next();
  }

  try {
    // Fetch global settings to check maintenance mode
    const settingsRes = await fetch(
      `${url.origin}/api/settings?siteId=${encodeURIComponent(siteId)}`,
      { headers: { "x-internal-check": "1" } },
    );

    if (settingsRes.ok) {
      const settingsData = await settingsRes.json();
      const ws = settingsData?.websiteSettings;
      const isMaintenanceMode = ws?.maintenanceMode === true;

      if (isMaintenanceMode) {
        // Allow admin users (with active NextAuth session) through
        const hasSession =
          request.cookies.has("next-auth.session-token") ||
          request.cookies.has("__Secure-next-auth.session-token");

        if (!hasSession) {
          const maintenanceUrl = new URL("/maintenance", url);
          if (ws.maintenanceMessage) {
            maintenanceUrl.searchParams.set("message", ws.maintenanceMessage);
          }
          return NextResponse.redirect(maintenanceUrl);
        }
      }
    }
  } catch (err) {
    // If maintenance check fails, allow the request through
    console.error("Maintenance mode check error:", err.message);
  }

  // --------------- Redirect rule resolution ---------------
  // Only apply redirects to page routes (not API routes, not static files)
  if (
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/maintenance")
  ) {
    try {
      const redirectRes = await fetch(
        `${url.origin}/api/redirects?siteId=${encodeURIComponent(siteId)}&source=${encodeURIComponent(pathname)}`,
        { headers: { "x-internal-check": "1" } },
      );

      if (redirectRes.ok) {
        const redirectData = await redirectRes.json();
        const redirect = redirectData?.redirect;

        if (redirect && redirect.target && redirect.target !== pathname) {
          const redirectUrl = new URL(redirect.target, url);
          const status = redirect.type === 302 ? 302 : 301;
          return NextResponse.redirect(redirectUrl, { status });
        }
      }
    } catch (err) {
      console.error("Redirect resolution error:", err.message);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // API routes (with CORS handling)
    "/api/:path*",
    // All page routes (for maintenance mode check)
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

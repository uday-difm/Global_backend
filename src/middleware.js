import { NextResponse } from "next/server";

export function middleware(request) {
  const origin = request.headers.get("origin") || "*";

  if (request.method === "OPTIONS") {
    const preflightHeaders = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
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

export const config = {
  matcher: "/api/:path*",
};

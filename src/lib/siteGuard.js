export function getSiteId(req) {
  const siteId =
    req.headers.get("x-site-id") || req.nextUrl?.searchParams?.get("site_id");

  if (!siteId) {
    throw new Error("Missing site id");
  }

  return siteId;
}

export function getSiteId(req) {
  const searchParams = req.nextUrl?.searchParams;
  const siteId =
    req.headers.get("x-site-id") ||
    searchParams?.get("siteId") ||
    searchParams?.get("site_id");

  if (!siteId) {
    throw new Error("Missing site id");
  }

  return siteId;
}

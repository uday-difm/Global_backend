import { NextResponse } from "next/server";
import { checkSitePermission } from "@/lib/apiAuth";

export async function GET(req) {
  const auth = await checkSitePermission(req, "ADMIN");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // Version details and history
  const versionHistory = [
    { version: "1.0.0", releaseDate: "2026-06-19", changes: "Initial release of multi-site CMS global backend with 28 modules" }
  ];

  return NextResponse.json({
    success: true,
    currentVersion: "1.0.0",
    buildTime: new Date().toISOString(),
    history: versionHistory
  });
}

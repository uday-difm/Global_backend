import { NextResponse } from "next/server";
import { legalPageService } from "@/services/legalPage.service";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json({ error: "siteId parameter is required" }, { status: 400 });
    }

    const legalPages = await legalPageService.getAllActivePages(siteId);
    return NextResponse.json({ success: true, legalPages });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}

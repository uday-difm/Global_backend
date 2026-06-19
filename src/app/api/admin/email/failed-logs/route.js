import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSitePermission } from "@/lib/apiAuth";

export async function GET(req) {
  const auth = await checkSitePermission(req, "ADMIN");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const settings = await prisma.globalSettings.findUnique({
      where: { siteId: auth.siteId },
      select: { emailSettings: true }
    });

    const emailSettings = settings?.emailSettings || {};
    const failedLogs = emailSettings.failedLogs || [];

    return NextResponse.json({ success: true, failedLogs });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}

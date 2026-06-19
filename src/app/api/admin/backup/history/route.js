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
      select: { devTools: true }
    });

    const devTools = settings?.devTools || {};
    const backupHistory = devTools.backupHistory || [];

    return NextResponse.json({ success: true, backupHistory });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}

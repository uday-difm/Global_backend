import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSitePermission } from "@/lib/apiAuth";

export async function GET(req) {
  const auth = await checkSitePermission(req, "ADMIN");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    // Fetch failed attempts or error logs from AuditLog
    const errorLogs = await prisma.auditLog.findMany({
      where: {
        siteId: auth.siteId,
        action: {
          contains: "FAIL"
        }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    });

    return NextResponse.json({
      success: true,
      errorLogs
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}

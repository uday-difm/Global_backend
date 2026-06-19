import { NextResponse } from "next/server";
import { checkSitePermission } from "@/lib/apiAuth";
import { backupService } from "@/services/backup.service";
import { handleApiError } from "@/core/errors";

export async function POST(req) {
  const auth = await checkSitePermission(req, "ADMIN");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { backup } = await req.json();
    const result = await backupService.restoreBackup(auth.siteId, backup);

    return NextResponse.json({ 
      success: true, 
      message: "Site database restored successfully from backup" 
    });
  } catch (err) {
    return handleApiError(err);
  }
}


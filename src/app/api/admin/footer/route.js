import { NextResponse } from "next/server";
import { checkSitePermission } from "@/lib/apiAuth";
import { settingsService } from "@/services/settings.service";
import { handleApiError } from "@/core/errors";

export async function GET(req) {
  const auth = await checkSitePermission(req, "EDITOR");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const footer = await settingsService.getSettingsField(auth.siteId, "footer");
    return NextResponse.json({ success: true, footer });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req) {
  const auth = await checkSitePermission(req, "EDITOR");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const result = await settingsService.updateSettingsField(
      auth.siteId,
      "footer",
      body,
      auth.user.id
    );

    return NextResponse.json({ success: true, footer: result });
  } catch (err) {
    return handleApiError(err);
  }
}


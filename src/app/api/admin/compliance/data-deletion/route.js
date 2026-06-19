import { NextResponse } from "next/server";
import { complianceService } from "@/services/compliance.service";
import { checkSitePermission } from "@/lib/apiAuth";
import { handleApiError } from "@/core/errors";

export async function POST(req) {
  try {
    const auth = await checkSitePermission(req, "ADMIN");
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required for data deletion" }, { status: 400 });
    }

    const result = await complianceService.purgeGdprData(auth.siteId, email, auth.user.id);

    return NextResponse.json({
      success: true,
      message: `GDPR data deletion processed successfully for ${email}`,
      details: result,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

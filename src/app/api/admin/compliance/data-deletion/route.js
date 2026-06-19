import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSitePermission } from "@/lib/apiAuth";

export async function POST(req) {
  const auth = await checkSitePermission(req, "ADMIN");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required for data deletion" }, { status: 400 });
    }

    const siteId = auth.siteId;

    // Purge lead entries
    const deletedLeads = await prisma.lead.deleteMany({
      where: { siteId, email }
    });

    // Purge form submissions
    const deletedSubmissions = await prisma.contactFormSubmission.deleteMany({
      where: { siteId, email }
    });

    // Log compliance audit log
    await prisma.auditLog.create({
      data: {
        siteId,
        userId: auth.user.id,
        action: "GDPR_DATA_DELETION",
        meta: {
          targetEmail: email,
          deletedLeadsCount: deletedLeads.count,
          deletedSubmissionsCount: deletedSubmissions.count
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `GDPR data deletion processed successfully for ${email}`,
      details: {
        purgedLeads: deletedLeads.count,
        purgedSubmissions: deletedSubmissions.count
      }
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}

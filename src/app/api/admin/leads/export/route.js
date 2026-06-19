import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSitePermission } from "@/lib/apiAuth";

export async function GET(req) {
  const auth = await checkSitePermission(req, "EDITOR");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const leads = await prisma.lead.findMany({
      where: { siteId: auth.siteId },
      orderBy: { createdAt: "desc" }
    });

    const headers = ["ID", "Name", "Email", "Phone", "Service Interest", "Source Page", "Status", "Notes", "Created At"];
    const rows = leads.map(lead => [
      lead.id,
      lead.name.replace(/"/g, '""'),
      lead.email.replace(/"/g, '""'),
      (lead.phone || "").replace(/"/g, '""'),
      (lead.serviceInterest || "").replace(/"/g, '""'),
      (lead.sourcePage || "").replace(/"/g, '""'),
      lead.status,
      (lead.notes || "").replace(/"/g, '""'),
      lead.createdAt.toISOString()
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${val}"`).join(","))
    ].join("\n");

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="leads_site_${auth.siteId}.csv"`
      }
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}

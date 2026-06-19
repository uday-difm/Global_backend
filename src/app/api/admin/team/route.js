import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSitePermission } from "@/lib/apiAuth";
import { z } from "zod";

const TeamMemberSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  photo: z.string().optional(),
  bio: z.string().optional(),
  socialLinks: z.any().optional(),
  sortOrder: z.number().optional().default(0)
});

export async function GET(req) {
  const auth = await checkSitePermission(req, "EDITOR");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const team = await prisma.teamMember.findMany({
      where: { siteId: auth.siteId },
      orderBy: { sortOrder: "asc" }
    });

    return NextResponse.json({ success: true, teamMembers: team });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const auth = await checkSitePermission(req, "EDITOR");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = TeamMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
    }

    const teamMember = await prisma.teamMember.create({
      data: {
        siteId: auth.siteId,
        ...parsed.data
      }
    });

    return NextResponse.json({ success: true, teamMember }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}

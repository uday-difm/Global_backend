import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSitePermission } from "@/lib/apiAuth";
import { z } from "zod";

const TeamMemberUpdateSchema = z.object({
  name: z.string().optional(),
  role: z.string().optional(),
  photo: z.string().optional(),
  bio: z.string().optional(),
  socialLinks: z.any().optional(),
  sortOrder: z.number().optional()
});

export async function GET(req, context) {
  const params = await context.params;
  const id = params?.id;
  const auth = await checkSitePermission(req, "EDITOR");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const member = await prisma.teamMember.findFirst({
      where: { id, siteId: auth.siteId }
    });

    if (!member) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, teamMember: member });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}

export async function PATCH(req, context) {
  const params = await context.params;
  const id = params?.id;
  const auth = await checkSitePermission(req, "EDITOR");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const member = await prisma.teamMember.findFirst({
      where: { id, siteId: auth.siteId }
    });

    if (!member) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = TeamMemberUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
    }

    const updated = await prisma.teamMember.update({
      where: { id },
      data: parsed.data
    });

    return NextResponse.json({ success: true, teamMember: updated });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  const params = await context.params;
  const id = params?.id;
  const auth = await checkSitePermission(req, "EDITOR");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const member = await prisma.teamMember.findFirst({
      where: { id, siteId: auth.siteId }
    });

    if (!member) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 });
    }

    await prisma.teamMember.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Team member deleted successfully" });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}

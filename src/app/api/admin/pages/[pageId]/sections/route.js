// global_backend/src/app/api/admin/pages/[pageId]/sections/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { hasRole, ROLES } from "@/lib/rbac";
import { logAction } from "@/lib/audit";
import { z } from "zod";
import { tryValidateByType } from "@/lib/validators/section";

async function getAuthenticatedUser() {
  const user = await requireAuth();
  if (!user && process.env.NODE_ENV === "development") {
    return await prisma.user.findFirst();
  }
  return user;
}

const CreateSectionSchema = z.object({
  type: z.string().min(1),
  content: z.any().optional(),
  order: z.number().int().min(0).optional(),
});

function siteRoleMeets(requiredRole, userGlobalRole, siteRole) {
  if (userGlobalRole === ROLES.SUPERADMIN) return true;
  if (!siteRole) return false;
  return hasRole(siteRole, requiredRole);
}

export async function GET(req, { params }) {
  const user = await getAuthenticatedUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resolvedParams = await params;
  const pageId =
    resolvedParams?.pageId || new URL(req.url).searchParams.get("pageId");
  if (!pageId)
    return NextResponse.json({ error: "pageId required" }, { status: 400 });

  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: { siteId: true },
  });
  if (!page)
    return NextResponse.json({ error: "Page not found" }, { status: 404 });

  const su = await prisma.siteUser.findUnique({
    where: { siteId_userId: { siteId: page.siteId, userId: user.id } },
  });
  const siteRole = su?.role ?? null;

  if (
    !siteRoleMeets(ROLES.EDITOR, user.globalRole, siteRole) &&
    process.env.NODE_ENV !== "development"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sections = await prisma.section.findMany({
    where: { pageId },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ sections });
}

export async function POST(req, { params }) {
  const user = await getAuthenticatedUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resolvedParams = await params;
  const pageId =
    resolvedParams?.pageId || new URL(req.url).searchParams.get("pageId");
  if (!pageId)
    return NextResponse.json({ error: "pageId required" }, { status: 400 });

  try {
    const body = await req.json();
    const validated = CreateSectionSchema.parse(body);

    // Validate by type (server-side). Unknown types pass.
    const v = tryValidateByType(validated.type, validated);
    if (!v.ok) {
      const err = v.error;
      if (err.name === "ZodError") {
        return NextResponse.json(
          { error: "Validation failed", details: err.errors },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: "Validation failed", message: String(err) },
        { status: 400 },
      );
    }

    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { siteId: true },
    });
    if (!page)
      return NextResponse.json({ error: "Page not found" }, { status: 404 });

    const su = await prisma.siteUser.findUnique({
      where: { siteId_userId: { siteId: page.siteId, userId: user.id } },
    });
    const siteRole = su?.role ?? null;
    if (
      !siteRoleMeets(ROLES.EDITOR, user.globalRole, siteRole) &&
      process.env.NODE_ENV !== "development"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const content = validated.content ?? {};
    let newSection;

    if (typeof validated.order === "number") {
      await prisma.$transaction(async (tx) => {
        await tx.section.updateMany({
          where: { pageId, order: { gte: validated.order } },
          data: { order: { increment: 1 } },
        });
        newSection = await tx.section.create({
          data: {
            pageId,
            type: validated.type,
            content,
            order: validated.order,
          },
        });
      });
    } else {
      const max = await prisma.section.findFirst({
        where: { pageId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      const nextOrder = (max?.order ?? -1) + 1;
      newSection = await prisma.section.create({
        data: { pageId, type: validated.type, content, order: nextOrder },
      });
    }

    await logAction(page.siteId, user.id, "SECTION_CREATED", {
      pageId,
      sectionId: newSection.id,
      type: validated.type,
      order: newSection.order,
    });

    return NextResponse.json({ section: newSection }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.errors },
        { status: 400 },
      );
    }
    console.error("Failed to create section:", err);
    return NextResponse.json(
      { error: "Failed to create section", message: err?.message },
      { status: 500 },
    );
  }
}

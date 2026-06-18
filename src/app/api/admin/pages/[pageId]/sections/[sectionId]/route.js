// global_backend/src/app/api/admin/pages/[pageId]/sections/[sectionId]/route.js
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

const UpdateSectionSchema = z.object({
  content: z.any().optional(),
  type: z.string().optional(),
  isVisible: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

function siteRoleMeets(requiredRole, userGlobalRole, siteRole) {
  if (userGlobalRole === ROLES.SUPERADMIN) return true;
  if (!siteRole) return false;
  return hasRole(siteRole, requiredRole);
}

export async function PATCH(req, { params }) {
  const user = await getAuthenticatedUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resolvedParams = await params;
  const pageId =
    resolvedParams?.pageId || new URL(req.url).searchParams.get("pageId");
  const sectionId = resolvedParams?.sectionId || null;
  if (!pageId || !sectionId)
    return NextResponse.json(
      { error: "pageId and sectionId required" },
      { status: 400 },
    );

  try {
    const body = await req.json();
    const validated = UpdateSectionSchema.parse(body);

    // If type or content provided, run validation by type
    const typeToValidate = validated.type ?? undefined;
    if (typeToValidate || "content" in validated) {
      const existingSection = await prisma.section.findUnique({
        where: { id: sectionId },
      });
      if (!existingSection || existingSection.pageId !== pageId) {
        return NextResponse.json(
          { error: "Section not found" },
          { status: 404 },
        );
      }

      const effectiveType = String(
        typeToValidate ?? existingSection.type,
      ).toUpperCase();
      const v = tryValidateByType(effectiveType, {
        content: validated.content ?? existingSection.content,
      });
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
    }

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
    });
    if (!section || section.pageId !== pageId) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
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

    const payload = {};
    if ("content" in validated) payload.content = validated.content ?? {};
    if ("type" in validated) payload.type = validated.type;
    if ("isVisible" in validated) payload.isVisible = validated.isVisible;

    let updatedSection = null;
    if (
      typeof validated.order === "number" &&
      validated.order !== section.order
    ) {
      const oldOrder = section.order;
      const newOrder = validated.order;

      if (newOrder > oldOrder) {
        await prisma.$transaction([
          prisma.section.updateMany({
            where: { pageId, order: { gt: oldOrder, lte: newOrder } },
            data: { order: { increment: -1 } },
          }),
          prisma.section.update({
            where: { id: sectionId },
            data: { ...payload, order: newOrder },
          }),
        ]);
      } else {
        await prisma.$transaction([
          prisma.section.updateMany({
            where: { pageId, order: { gte: newOrder, lt: oldOrder } },
            data: { order: { increment: 1 } },
          }),
          prisma.section.update({
            where: { id: sectionId },
            data: { ...payload, order: newOrder },
          }),
        ]);
      }

      updatedSection = await prisma.section.findUnique({
        where: { id: sectionId },
      });
    } else {
      updatedSection = await prisma.section.update({
        where: { id: sectionId },
        data: payload,
      });
    }

    await logAction(page.siteId, user.id, "SECTION_UPDATED", {
      pageId,
      sectionId,
      changes: validated,
    });

    return NextResponse.json({ section: updatedSection });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.errors },
        { status: 400 },
      );
    }
    console.error("Failed to update section:", err);
    return NextResponse.json(
      { error: "Failed to update section", message: err?.message },
      { status: 500 },
    );
  }
}

export async function DELETE(req, { params }) {
  const user = await getAuthenticatedUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resolvedParams = await params;
  const pageId =
    resolvedParams?.pageId || new URL(req.url).searchParams.get("pageId");
  const sectionId = resolvedParams?.sectionId || null;
  if (!pageId || !sectionId)
    return NextResponse.json(
      { error: "pageId and sectionId required" },
      { status: 400 },
    );

  try {
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
    });
    if (!section || section.pageId !== pageId)
      return NextResponse.json({ error: "Section not found" }, { status: 404 });

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

    await prisma.$transaction(async (tx) => {
      await tx.section.delete({ where: { id: sectionId } });

      const remaining = await tx.section.findMany({
        where: { pageId },
        orderBy: { order: "asc" },
        select: { id: true },
      });

      const ops = remaining.map((s, idx) =>
        tx.section.update({ where: { id: s.id }, data: { order: idx } }),
      );
      if (ops.length) await Promise.all(ops);
    });

    await logAction(page.siteId, user.id, "SECTION_DELETED", {
      pageId,
      sectionId,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete section:", err);
    return NextResponse.json(
      { error: "Failed to delete section", message: err?.message },
      { status: 500 },
    );
  }
}

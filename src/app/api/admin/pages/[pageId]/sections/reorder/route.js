import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { hasRole, ROLES } from "@/lib/rbac";
import { logAction } from "@/lib/audit";
import { z } from "zod";

async function getAuthenticatedUser() {
  const user = await requireAuth();
  if (!user && process.env.NODE_ENV === "development") {
    return await prisma.user.findFirst();
  }
  return user;
}

const ReorderSchema = z.object({ orderedIds: z.array(z.string()).min(1) });

function siteRoleMeets(requiredRole, userGlobalRole, siteRole) {
  if (userGlobalRole === ROLES.SUPERADMIN) return true;
  if (!siteRole) return false;
  return hasRole(siteRole, requiredRole);
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
    const { orderedIds } = ReorderSchema.parse(body);

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
      where: { pageId, id: { in: orderedIds } },
      select: { id: true },
    });
    if (sections.length !== orderedIds.length) {
      return NextResponse.json(
        { error: "One or more section IDs are invalid for this page" },
        { status: 400 },
      );
    }

    const updates = orderedIds.map((id, idx) =>
      prisma.section.update({ where: { id }, data: { order: idx } }),
    );
    await prisma.$transaction(updates);

    await logAction(page.siteId, user.id, "SECTION_REORDERED", {
      pageId,
      orderedIds,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.errors },
        { status: 400 },
      );
    }
    console.error("Failed to reorder sections:", err);
    return NextResponse.json(
      { error: "Failed to reorder sections", message: err?.message },
      { status: 500 },
    );
  }
}

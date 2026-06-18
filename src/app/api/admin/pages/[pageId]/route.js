import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { canAssignRole, ROLES } from "@/lib/rbac";
import { logAction } from "@/lib/audit";
import { z } from "zod";

async function getAuthenticatedUser() {
  const user = await requireAuth();
  if (!user && process.env.NODE_ENV === "development") {
    return await prisma.user.findFirst();
  }
  return user;
}

// Get site-specific role for a user
async function getSiteRole(userId, siteId) {
  try {
    const su = await prisma.siteUser.findUnique({
      where: { siteId_userId: { siteId, userId } },
    });
    return su?.role || null;
  } catch (e) {
    console.error("getSiteRole error:", e);
    return null;
  }
}

// Returns true if user.globalRole is SUPERADMIN OR site role meets requiredRole via hasRole()
// Returns true if user.globalRole is SUPERADMIN OR site role meets requiredRole via canAssignRole()
async function userHasSiteRole(user, siteId, requiredRole) {
  if (!user) return false;
  if (user.globalRole === ROLES.SUPERADMIN) return true;
  const siteRole = await getSiteRole(user.id, siteId);
  if (!siteRole) return false;
  return canAssignRole(siteRole, requiredRole);
}

const PageUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  jsonLd: z.any().optional(), // accept JSON or null
});

export async function PATCH(req, { params }) {
  const user = await getAuthenticatedUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // params is a Promise in App Router - await it
  const resolvedParams = await params;
  const url = new URL(req.url);
  const pageId = resolvedParams?.pageId || url.searchParams.get("pageId");

  if (!pageId)
    return NextResponse.json({ error: "pageId required" }, { status: 400 });

  try {
    const body = await req.json();
    console.log("[PATCH] body:", body);
    const validatedData = PageUpdateSchema.parse(body);
    console.log("[PATCH] validatedData:", validatedData);

    const currentPage = await prisma.page.findUnique({
      where: { id: pageId },
      select: { siteId: true, status: true },
    });

    if (!currentPage)
      return NextResponse.json({ error: "Page not found" }, { status: 404 });

    // Authorization: Editors can edit, Admins can publish
    const canEdit = await userHasSiteRole(
      user,
      currentPage.siteId,
      ROLES.EDITOR,
    );
    if (!canEdit && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (
      validatedData.status &&
      validatedData.status !== currentPage.status // status is changing
    ) {
      const canPublish = await userHasSiteRole(
        user,
        currentPage.siteId,
        ROLES.ADMIN,
      );
      if (!canPublish && process.env.NODE_ENV !== "development") {
        return NextResponse.json(
          { error: "Only admins can change page status" },
          { status: 403 },
        );
      }
    }

    const updateData = { ...validatedData };

    // Try to set publishedAt/publishedBy only when publishing/unpublishing
    if (
      validatedData.status === "PUBLISHED" &&
      currentPage.status !== "PUBLISHED"
    ) {
      updateData.publishedAt = new Date();
      updateData.publishedBy = user.id;
      await logAction(currentPage.siteId, user.id, "PAGE_PUBLISHED", {
        pageId,
      });
    } else if (
      validatedData.status === "DRAFT" &&
      currentPage.status !== "DRAFT"
    ) {
      updateData.publishedAt = null;
      updateData.publishedBy = null;
      await logAction(currentPage.siteId, user.id, "PAGE_UNPUBLISHED", {
        pageId,
      });
    }

    console.log("[PATCH] updateData:", updateData);

    // Perform update and catch Prisma errors separately for clearer messages
    let updatedPage;
    try {
      updatedPage = await prisma.page.update({
        where: { id: pageId },
        data: updateData,
      });
    } catch (prismaErr) {
      console.error("[PATCH] prisma.page.update error:", prismaErr);
      // Helpful error response in development
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json(
          {
            error: "Prisma update failed",
            message: prismaErr.message,
            code: prismaErr.code,
            meta: prismaErr.meta,
          },
          { status: 500 },
        );
      }
      return NextResponse.json(
        { error: "Failed to update page" },
        { status: 500 },
      );
    }

    await logAction(currentPage.siteId, user.id, "PAGE_UPDATED", {
      pageId,
      changes: validatedData,
    });

    return NextResponse.json({ page: updatedPage });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }
    console.error("[PATCH] unhandled error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update page" },
      { status: 500 },
    );
  }
}

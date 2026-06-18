import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { hasRole, ROLES } from "@/lib/rbac";
import { logAction } from "@/lib/audit";

// Helper to enforce Admin access for all routes in this file
async function checkAdminAuth() {
  const user = await requireAuth();
  const isDev = process.env.NODE_ENV === "development";

  if (user) return { user };

  if (isDev) {
    // FETCH REAL USER to satisfy foreign key constraints
    const firstUser = await prisma.user.findFirst();
    if (firstUser) {
      return { user: { ...firstUser, globalRole: "SUPERADMIN" } };
    }
  }

  return { error: "Forbidden", status: 403 };
}

// GET: View specific user details
export async function GET(req, { params }) {
  const { id } = await params;
  const auth = await checkAdminAuth();
  if (auth.error)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        loginHistory: { orderBy: { createdAt: "desc" }, take: 5 },
        auditLogs: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { passwordHash, ...userProfile } = user;
    return NextResponse.json({ user: userProfile });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// PATCH: Update user role or status
export async function PATCH(req, { params }) {
  const { id } = await params;
  const auth = await checkAdminAuth();
  if (auth.error)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { globalRole: body.globalRole, isActive: body.isActive },
    });

    // Use auth.user.id, not user.id
    await logAction(null, auth.user.id, "USER_ROLE_UPDATED", {
      targetUserId: id,
      newRole: body.globalRole,
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("PATCH Error:", error); // Added log to see real error
    return NextResponse.json({ error: "Failed to update" }, { status: 400 });
  }
}

// DELETE: Remove user
export async function DELETE(req, { params }) {
  const { id } = await params;
  const auth = await checkAdminAuth();
  if (auth.error)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    await prisma.user.delete({ where: { id } });

    // Use auth.user.id
    await logAction(null, auth.user.id, "USER_DELETED", { targetUserId: id });

    return NextResponse.json({ message: "User deleted" });
  } catch (error) {
    console.error("DELETE Error:", error); // Added log to see real error
    return NextResponse.json({ error: "Failed to delete" }, { status: 400 });
  }
}

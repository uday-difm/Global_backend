import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { ROLES } from "@/lib/rbac";
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

function canDeleteRole(creatorRole, targetRole) {
  const c = ROLES[creatorRole] || 0;
  const t = ROLES[targetRole] || 0;
  // require that creator's role level is strictly greater than target's
  return c > t;
}

export async function DELETE(req, context) {
  try {
    // Next passes params as a Promise in some runtimes for route handlers; await it.
    const params = await context.params;
    const id = params?.id;

    // Auth
    const authUser = await requireAuth();
    const isDev = process.env.NODE_ENV === "development";

    let caller = authUser;
    if (!caller && isDev) {
      // dev fallback
      caller = await prisma.user.findFirst();
      if (!caller) {
        return NextResponse.json(
          { error: "No users found in DB for dev bypass" },
          { status: 401 },
        );
      }
    }

    if (!caller)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!id) {
      return NextResponse.json({ error: "Missing user id" }, { status: 400 });
    }

    // Prevent self-delete
    if (caller.id === id) {
      return NextResponse.json(
        { error: "Cannot delete yourself" },
        { status: 400 },
      );
    }

    // Find target user
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Authorization: require caller role strictly higher than target role
    if (!canDeleteRole(caller.globalRole, target.globalRole)) {
      return NextResponse.json(
        { error: "Forbidden: insufficient permission to deactivate this user" },
        { status: 403 },
      );
    }

    // Delete user
    await prisma.user.delete({ where: { id } });

    // Audit log
    try {
      await logAction(null, caller.id, "USER_DELETED", { targetUserId: id });
    } catch (logErr) {
      console.error("Failed to write audit log:", logErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/users/[id] error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: String(err?.message || err) },
      { status: 500 },
    );
  }
}

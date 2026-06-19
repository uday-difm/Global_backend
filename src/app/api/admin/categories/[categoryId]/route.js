import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { canManageBlogs } from "@/lib/permissions";

async function getAuthenticatedUser() {
  const user = await requireAuth();
  if (!user && process.env.NODE_ENV === "development") {
    return await prisma.user.findFirst();
  }
  return user;
}

// DELETE /api/admin/categories/[categoryId] - Delete a category
export async function DELETE(req, { params }) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManageBlogs(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { categoryId } = await params;

  try {
    const existing = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Delete category. Implicit many-to-many relationship with posts will disconnect automatically.
    await prisma.category.delete({
      where: { id: categoryId }
    });

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("Delete category error:", err);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}

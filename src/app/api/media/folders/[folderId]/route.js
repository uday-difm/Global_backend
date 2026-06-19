import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

async function getAuthenticatedUser() {
  const user = await requireAuth();
  if (!user && process.env.NODE_ENV === "development") {
    return await prisma.user.findFirst();
  }
  return user;
}

// DELETE /api/media/folders/[folderId] - Delete folder safely
export async function DELETE(request, { params }) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { folderId } = await params;

  try {
    const folder = await prisma.mediaFolder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const parentIdOfDeleted = folder.parentId; // could be null or cuid

    // 1. Re-parent direct subfolders to the parent of the deleted folder
    await prisma.mediaFolder.updateMany({
      where: { parentId: folderId },
      data: { parentId: parentIdOfDeleted },
    });

    // 2. Re-parent direct media files to the parent of the deleted folder
    await prisma.media.updateMany({
      where: { folderId: folderId },
      data: { folderId: parentIdOfDeleted },
    });

    // 3. Delete the folder record
    await prisma.mediaFolder.delete({
      where: { id: folderId },
    });

    return NextResponse.json({ success: true, message: "Folder deleted successfully" });
  } catch (err) {
    console.error("Delete folder error:", err);
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 });
  }
}

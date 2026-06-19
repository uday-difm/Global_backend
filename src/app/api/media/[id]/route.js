import prisma from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireAuth";

async function getAuthenticatedUser() {
  const user = await requireAuth();
  if (!user && process.env.NODE_ENV === "development") {
    return await prisma.user.findFirst();
  }
  return user;
}

// GET /api/media/[id] - Get details + usage diagnostics
export async function GET(req, { params }) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const media = await prisma.media.findUnique({
      where: { id },
      include: {
        folder: true
      }
    });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Find where the media is used
    const postsUsing = await prisma.post.findMany({
      where: { featuredImageId: id },
      select: { id: true, title: true }
    });

    const servicesUsing = await prisma.service.findMany({
      where: { featuredImageId: id },
      select: { id: true, title: true }
    });

    const usages = [
      ...postsUsing.map(p => ({ id: p.id, title: p.title, type: "Post", link: `/blogs/${p.id}/edit` })),
      ...servicesUsing.map(s => ({ id: s.id, title: s.title, type: "Service", link: `/services/${s.id}/edit` }))
    ];

    return NextResponse.json({ media, usages });
  } catch (err) {
    console.error("Fetch media details error:", err);
    return NextResponse.json({ error: "Failed to fetch details" }, { status: 500 });
  }
}

// PATCH /api/media/[id] - Edit fileName, altText, or move folderId
export async function PATCH(req, { params }) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { altText, fileName, folderId } = body;

    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const updateData = {};
    if (altText !== undefined) updateData.altText = altText;
    if (fileName !== undefined && fileName.trim() !== "") updateData.fileName = fileName.trim();
    
    if (folderId !== undefined) {
      updateData.folderId = (folderId === "root" || folderId === "null" || !folderId) ? null : folderId;
    }

    const updatedMedia = await prisma.media.update({
      where: { id },
      data: updateData,
      include: {
        folder: true
      }
    });

    return NextResponse.json({ success: true, media: updatedMedia });
  } catch (err) {
    console.error("Update media error:", err);
    return NextResponse.json({ error: "Failed to update media" }, { status: 500 });
  }
}

// DELETE /api/media/[id] - Delete file
export async function DELETE(req, { params }) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Try to delete from Cloudinary
    try {
      if (media.publicId) {
        await cloudinary.uploader.destroy(media.publicId);
      }
    } catch (clErr) {
      console.warn("Could not delete from Cloudinary, deleting DB record anyway:", clErr);
    }

    // Delete database record (relationships will set to null automatically)
    await prisma.media.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    console.error("Delete media error:", err);
    return NextResponse.json({ error: "Failed to delete media" }, { status: 500 });
  }
}

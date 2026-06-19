import { NextResponse } from "next/server";
import { Readable } from "stream";
import cloudinary from "@/lib/cloudinary";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

async function getAuthenticatedUser() {
  const user = await requireAuth();
  if (!user && process.env.NODE_ENV === "development") {
    return await prisma.user.findFirst();
  }
  return user;
}

// POST /api/media/[id]/replace - Replace a file in place
export async function POST(request, { params }) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Destroy the old Cloudinary asset
    try {
      if (media.publicId) {
        await cloudinary.uploader.destroy(media.publicId);
      }
    } catch (clErr) {
      console.warn("Could not delete old asset from Cloudinary, proceeding with new upload:", clErr);
    }

    // 2. Upload the new file to Cloudinary with compression
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "global-cms",
          resource_type: "auto",
          quality: "auto",
          fetch_format: "auto",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );

      Readable.from(buffer).pipe(uploadStream);
    });

    // 3. Update the media record in the database
    const updatedMedia = await prisma.media.update({
      where: { id },
      data: {
        fileName: file.name,
        originalName: file.name,
        publicId: result.public_id,
        url: result.secure_url,
        secureUrl: result.secure_url,
        mimeType: file.type,
        extension: result.format,
        size: result.bytes,
        width: result.width || null,
        height: result.height || null,
      },
    });

    return NextResponse.json({
      success: true,
      media: updatedMedia,
    });
  } catch (error) {
    console.error("Replace media error:", error);
    return NextResponse.json({ error: "Replacement failed" }, { status: 500 });
  }
}

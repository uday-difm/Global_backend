import prisma from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { NextResponse } from "next/server";

export async function DELETE(req, { params }) {
  const { id } = await params;

  const media = await prisma.media.findUnique({
    where: {
      id,
    },
  });

  if (!media) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }

  await cloudinary.uploader.destroy(media.publicId);

  await prisma.media.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({
    success: true,
  });
}

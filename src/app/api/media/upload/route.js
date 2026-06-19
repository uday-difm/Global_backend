import { NextResponse } from "next/server";
import { Readable } from "stream";

import cloudinary from "@/lib/cloudinary";
import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");
    const folderId = formData.get("folderId");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

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

    const folderIdVal = (folderId === "root" || folderId === "null" || !folderId) ? null : folderId;

    const media = await prisma.media.create({
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
        folderId: folderIdVal,
      },
    });
    console.log(media);
    return NextResponse.json({
      success: true,
      media,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Upload failed",
      },
      {
        status: 500,
      },
    );
  }
}

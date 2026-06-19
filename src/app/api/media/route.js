import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");

    const whereClause = {};
    if (folderId !== null && folderId !== "") {
      if (folderId === "root") {
        whereClause.folderId = null;
      } else if (folderId !== "all") {
        whereClause.folderId = folderId;
      }
    }

    const media = await prisma.media.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(media);
  } catch (err) {
    console.error("Fetch media error:", err);
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 });
  }
}

import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const media = await prisma.media.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(media);
}

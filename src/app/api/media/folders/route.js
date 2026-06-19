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

// GET /api/media/folders - Get folders inside a parent
export async function GET(request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId");

    const whereClause = {};
    if (parentId !== "all") {
      if (parentId === "root" || parentId === null || parentId === "") {
        whereClause.parentId = null;
      } else {
        whereClause.parentId = parentId;
      }
    }

    const folders = await prisma.mediaFolder.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            media: true,
            children: true,
          }
        }
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ folders });
  } catch (err) {
    console.error("Fetch folders error:", err);
    return NextResponse.json({ error: "Failed to fetch folders" }, { status: 500 });
  }
}

// POST /api/media/folders - Create a new folder
export async function POST(request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, parentId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
    }

    const parentIdVal = (parentId === "root" || parentId === "null" || !parentId) ? null : parentId;

    // Check if a folder with the same name already exists in this parent folder
    const existing = await prisma.mediaFolder.findFirst({
      where: {
        name: name.trim(),
        parentId: parentIdVal,
      },
    });

    if (existing) {
      return NextResponse.json({ error: "A folder with this name already exists in this directory." }, { status: 400 });
    }

    const folder = await prisma.mediaFolder.create({
      data: {
        name: name.trim(),
        parentId: parentIdVal,
      },
    });

    return NextResponse.json({ folder }, { status: 201 });
  } catch (err) {
    console.error("Create folder error:", err);
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
}

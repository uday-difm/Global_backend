import { NextResponse } from "next/server";
import { postService } from "@/services/post.service";
import { checkSitePermission } from "@/lib/apiAuth";
import { handleApiError } from "@/core/errors";

export async function GET(req) {
  try {
    const auth = await checkSitePermission(req, "EDITOR");
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;

    const posts = await postService.getPosts(auth.siteId, {
      status,
      categoryId,
    });

    return NextResponse.json({ posts });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req) {
  try {
    const auth = await checkSitePermission(req, "EDITOR");
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const post = await postService.create(auth.siteId, body, auth.user.id);
    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

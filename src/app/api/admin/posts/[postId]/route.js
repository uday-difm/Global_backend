import { NextResponse } from "next/server";
import { postService } from "@/services/post.service";
import { checkSitePermission } from "@/lib/apiAuth";
import { handleApiError } from "@/core/errors";

export async function GET(req, { params }) {
  try {
    const auth = await checkSitePermission(req, "EDITOR");
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { postId } = await params;
    const post = await postService.getById(auth.siteId, postId, {
      include: {
        categories: true,
        tags: true,
        author: { select: { id: true, email: true } },
        featuredImage: true,
      }
    });

    return NextResponse.json({ post });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req, { params }) {
  try {
    const auth = await checkSitePermission(req, "EDITOR");
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { postId } = await params;
    const body = await req.json();

    const post = await postService.update(auth.siteId, postId, body, auth.user.id);
    return NextResponse.json({ post });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = await checkSitePermission(req, "EDITOR");
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { postId } = await params;
    await postService.delete(auth.siteId, postId, auth.user.id);

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (err) {
    return handleApiError(err);
  }
}

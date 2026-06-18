import PostEditor from "../../PostEditor";
import prisma from "@/lib/prisma";

export default async function EditPostPage({ params }) {
  const { postId } = params;

  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Error</h1>
        <p className="mt-4 text-sm text-red-600">Post not found.</p>
      </div>
    );
  }

  // The siteId is taken from the post itself
  const siteId = post.siteId;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Edit Post</h1>
        <p className="text-sm text-slate-500 mt-1">Editing: {post.title}</p>
      </div>
      <div className="bg-white shadow rounded p-6">
        {/* We pass the full post object to pre-fill the form */}
        <PostEditor siteId={siteId} post={post} />
      </div>
    </div>
  );
}

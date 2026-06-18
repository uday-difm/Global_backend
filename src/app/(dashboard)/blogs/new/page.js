import PostEditor from "../PostEditor";
import prisma from "@/lib/prisma";

export default async function NewPostPage() {
  const site = await prisma.site.findFirst({ where: { isActive: true } });

  if (!site) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Error</h1>
        <p className="mt-4 text-sm text-red-600">No active site found.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Create New Post</h1>
      </div>
      <div className="bg-white shadow rounded p-6">
        {/* We pass the siteId for the API call */}
        <PostEditor siteId={site.id} />
      </div>
    </div>
  );
}

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

  // Fetch categories and authors for selection
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" }
  });

  const authors = await prisma.user.findMany({
    select: { id: true, email: true },
    orderBy: { email: "asc" }
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Create New Post</h1>
      </div>
      <div className="bg-white shadow rounded p-6">
        {/* We pass the siteId, categories, and authors */}
        <PostEditor siteId={site.id} categories={categories} authors={authors} />
      </div>
    </div>
  );
}

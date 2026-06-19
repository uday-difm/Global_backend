import Link from "next/link";
import prisma from "@/lib/prisma";
import DeletePostButton from "./DeletePostButton";
import CategoryManager from "./CategoryManager";

export default async function BlogsAdmin() {
  // Fetch the first active site, consistent with other admin pages
  const site = await prisma.site.findFirst({ where: { isActive: true } });

  if (!site) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Blog</h1>
        <p className="mt-4 text-sm text-red-600">No active site found.</p>
      </div>
    );
  }

  // Fetch posts with categories and author
  const posts = await prisma.post.findMany({
    where: { siteId: site.id },
    orderBy: { updatedAt: "desc" },
    include: {
      author: {
        select: {
          email: true,
        },
      },
      categories: true,
    },
  });

  // Fetch all categories to populate the category manager
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { posts: true }
      }
    }
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Blog Posts & Resources</h1>
          <div className="text-sm text-slate-500 mt-1">
            Site: {site.name} ({site.domain || site.id})
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/blogs/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            Create New Post
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Posts List Column */}
        <div className="lg:col-span-3 bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Title & Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Categories
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Publish Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {posts.map((post) => {
                // Determine scheduled state
                const isScheduled =
                  post.status === "PUBLISHED" &&
                  post.publishedAt &&
                  new Date(post.publishedAt) > new Date();

                return (
                  <tr key={post.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900">
                        {post.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{post.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {post.categories.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">None</span>
                        ) : (
                          post.categories.map((cat) => (
                            <span
                              key={cat.id}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-3xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
                            >
                              {cat.name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {post.author?.email || "System"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isScheduled ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-55 bg-amber-100 text-amber-800">
                          Scheduled
                        </span>
                      ) : post.status === "PUBLISHED" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      {post.publishedAt ? (
                        <div>
                          <div>{new Date(post.publishedAt).toLocaleDateString()}</div>
                          <div className="text-3xs text-slate-400 mt-0.5">
                            {new Date(post.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ) : (
                        <span className="italic text-slate-400">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/blogs/${post.id}/edit`}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs transition-colors"
                      >
                        Edit
                      </Link>
                      <DeletePostButton postId={post.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {posts.length === 0 && (
            <div className="p-12 text-center text-sm text-slate-500">
              No blog posts found for this site.
            </div>
          )}
        </div>

        {/* Category Manager Sidebar Column */}
        <div className="lg:col-span-1">
          <CategoryManager initialCategories={categories} />
        </div>
      </div>
    </div>
  );
}

import React from "react";
import PostEditor from "../PostEditor";
import { requireAuth } from "@/lib/requireAuth";
import { getSiteForUser } from "@/lib/getSiteForUser";
import prisma from "@/lib/prisma";

export const metadata = {
  title: "Create New Post | CMS Admin",
  description: "Write and publish a new blog post with categories, featured image, author assignment, scheduling and SEO fields.",
};

export default async function NewPostPage() {
  const user = await requireAuth();
  if (!user) return null;

  const site = await getSiteForUser(user);
  if (!site) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Create New Post</h1>
        <p className="text-sm text-rose-600">No active site configured for your profile.</p>
      </div>
    );
  }

  // Categories scoped to this site
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  // Authors scoped to this site via SiteUser memberships
  const siteUsers = await prisma.siteUser.findMany({
    where: { siteId: site.id },
    include: { user: { select: { id: true, email: true } } },
  });
  const authors = siteUsers.map((su) => su.user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Create New Post</h1>
        <p className="text-sm text-slate-500 mt-1">
          Site: <span className="font-semibold text-slate-700">{site.name}</span>
        </p>
      </div>
      <PostEditor siteId={site.id} categories={categories} authors={authors} />
    </div>
  );
}

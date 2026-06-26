import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { getSiteForUser } from "@/lib/getSiteForUser";
import NewsletterClient from "./NewsletterClient";

export default async function NewsletterPage() {
  const user = await requireAuth();
  if (!user) return null;

  const site = await getSiteForUser(user);

  if (!site) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Newsletter Subscribers</h1>
        <p className="mt-4 text-sm text-red-600">No active site found.</p>
      </div>
    );
  }

  return <NewsletterClient siteId={site.id} />;
}

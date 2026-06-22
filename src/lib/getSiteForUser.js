import prisma from "@/lib/prisma";

import { cookies } from "next/headers";

/**
 * Resolves the active site for a given authenticated user.
 * Supporting cookie-based workspace selection switcher.
 *
 * @param {object} user - User object from requireAuth()
 * @returns {Promise<object|null>} Prisma Site record or null
 */
export async function getSiteForUser(user) {
  if (!user) return null;

  const cookieStore = await cookies();
  const selectedSiteId = cookieStore.get("active_site_id")?.value;

  if (selectedSiteId) {
    // 1. Verify if user is SUPERADMIN/ADMIN, or has SiteUser access to the selected site
    const isSuper = user.globalRole === "SUPERADMIN" || user.globalRole === "ADMIN";
    const membership = isSuper
      ? true
      : await prisma.siteUser.findFirst({
          where: { userId: user.id, siteId: selectedSiteId },
        });

    if (membership) {
      const site = await prisma.site.findUnique({
        where: { id: selectedSiteId },
      });
      if (site && site.isActive && !site.deletedAt) {
        return site;
      }
    }
  }

  // Fallback to default site selection (oldest site or first membership)
  if (user.globalRole === "SUPERADMIN" || user.globalRole === "ADMIN") {
    return prisma.site.findFirst({ where: { isActive: true, deletedAt: null }, orderBy: { createdAt: "asc" } });
  }

  const defaultMembership = await prisma.siteUser.findFirst({
    where: { userId: user.id, site: { isActive: true, deletedAt: null } },
    orderBy: { createdAt: "asc" },
    include: { site: true },
  });

  return defaultMembership?.site || null;
}

/**
 * Convenience wrapper that returns just the siteId string.
 */
export async function getSiteIdForUser(user) {
  const site = await getSiteForUser(user);
  return site?.id || null;
}

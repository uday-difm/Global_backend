import prisma from "@/lib/prisma";

/**
 * Resolves the active site for a given authenticated user.
 * - SUPERADMIN/ADMIN get the first site (oldest by createdAt)
 * - Other roles get the first site they're a member of via SiteUser
 *
 * @param {object} user - User object from requireAuth()
 * @returns {Promise<object|null>} Prisma Site record or null
 */
export async function getSiteForUser(user) {
  if (!user) return null;

  if (user.globalRole === "SUPERADMIN" || user.globalRole === "ADMIN") {
    return prisma.site.findFirst({ orderBy: { createdAt: "asc" } });
  }

  // For EDITOR / AUTHOR / VIEWER: look up their SiteUser membership
  const membership = await prisma.siteUser.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: { site: true },
  });

  return membership?.site || null;
}

/**
 * Convenience wrapper that returns just the siteId string.
 */
export async function getSiteIdForUser(user) {
  const site = await getSiteForUser(user);
  return site?.id || null;
}

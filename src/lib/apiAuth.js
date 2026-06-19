import { requireAuth } from "./requireAuth";
import prisma from "./prisma";
import { getSiteId } from "./siteGuard";
import { userHasSiteRole } from "./siteAuth";

export async function getAuthUserOrDevBypass() {
  const user = await requireAuth();
  if (user) return user;

  if (process.env.NODE_ENV === "development") {
    const devUser = await prisma.user.findFirst();
    if (devUser) {
      return {
        ...devUser,
        globalRole: devUser.globalRole || "SUPERADMIN"
      };
    }
  }
  return null;
}

export async function checkSitePermission(req, requiredRole) {
  const user = await getAuthUserOrDevBypass();
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  let siteId;
  try {
    siteId = getSiteId(req);
  } catch (e) {
    return { error: "Missing site_id", status: 400 };
  }

  if (requiredRole) {
    const hasAccess = await userHasSiteRole(user, siteId, requiredRole);
    if (!hasAccess) {
      return { error: "Forbidden: Insufficient permissions", status: 403 };
    }
  }

  return { user, siteId };
}

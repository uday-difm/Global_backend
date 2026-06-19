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

  // Enforce IP Blockcheck & Rate Limiting
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const { securityService } = await import("@/services/security.service");
    const isBlocked = await securityService.isIpBlocked(siteId, ip);
    if (isBlocked) {
      return { error: "Access Denied: Your IP is blocked", status: 403 };
    }

    const controls = await securityService.getSecurityControls(siteId);
    const limitRps = controls.rateLimitRps || 60;
    const { checkRateLimit } = await import("@/lib/rateLimiter");
    const allowed = checkRateLimit(ip, limitRps);
    if (!allowed) {
      return { error: "Too Many Requests: Rate limit exceeded", status: 429 };
    }
  } catch (e) {
    console.error("IP checking / Rate limiting failed inside checkSitePermission:", e);
  }

  if (requiredRole) {
    const hasAccess = await userHasSiteRole(user, siteId, requiredRole);
    if (!hasAccess) {
      return { error: "Forbidden: Insufficient permissions", status: 403 };
    }
  }

  return { user, siteId };
}

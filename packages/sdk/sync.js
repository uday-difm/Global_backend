import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Next.js Automated Page Discovery & Auto-Sync Hook Script
 * Scans the routing directory of a Next.js project and submits route manifest to the Global Backend.
 */

export function scanRoutes(appDir) {
  const routesList = [];

  const traverse = (dir) => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (
        file.toLowerCase().startsWith("page.") &&
        (file.endsWith(".js") || file.endsWith(".jsx") || file.endsWith(".tsx"))
      ) {
        // Resolve path relative to cwd
        const relativeFilePath = path.relative(process.cwd(), fullPath).replace(/\\/g, "/");

        // Compute slug from folder path relative to the app router folder
        const routeFolder = path.relative(appDir, dir).replace(/\\/g, "/");
        
        // Remove Next.js group route parentheses (e.g. (dashboard)) and optional catch-alls (e.g. [[...slug]])
        let slug = "/" + routeFolder
          .split("/")
          .filter(segment => {
            return segment && 
              !segment.startsWith("(") && 
              !segment.endsWith(")") &&
              !(segment.startsWith("[[...") && segment.endsWith("]]"));
          })
          .join("/");

        // Sanitize root slug double slash
        if (slug === "//" || slug === "") slug = "/";

        // Detect if dynamic route
        const isDynamic = slug.includes("[") && slug.includes("]");

        // Resolve human-readable title
        let title = slug === "/" ? "Home" : slug.split("/").pop();
        if (title) {
          title = title.replace(/[\[\]\.\+]/g, ""); // strip brackets
          title = title.charAt(0).toUpperCase() + title.slice(1);
        }

        routesList.push({
          slug,
          path: relativeFilePath,
          type: isDynamic ? "dynamic" : "static",
          title: title || "New Page"
        });
      }
    });
  };

  traverse(appDir);
  return routesList;
}

// Find app router path
export function getAppRouterPath(cwd = process.cwd()) {
  const srcApp = path.join(cwd, "src", "app");
  const rootApp = path.join(cwd, "app");

  if (fs.existsSync(srcApp)) return { absolute: srcApp, relative: "src/app" };
  if (fs.existsSync(rootApp)) return { absolute: rootApp, relative: "app" };
  
  return null;
}

async function run() {
  console.log("🔍 Scanning project app directory for page routes...");
  const appPath = getAppRouterPath();

  if (!appPath) {
    console.error("❌ Sync Error: Next.js 'app' or 'src/app' router folder was not found in " + process.cwd());
    process.exit(1);
  }

  // Load .env files if present
  try {
    const dotenv = await import("dotenv");
    dotenv.config();
  } catch (e) {
    // dotenv might not be installed in the parent, which is fine
  }

  const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL || "http://localhost:3000";
  const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID;
  const INTEGRATION_KEY = process.env.CMS_INTEGRATION_KEY;

  if (!SITE_ID) {
    console.error("❌ Sync Error: NEXT_PUBLIC_SITE_ID environment variable is missing.");
    process.exit(1);
  }

  if (!INTEGRATION_KEY) {
    console.warn("⚠️ Sync Warning: CMS_INTEGRATION_KEY environment variable is missing. Authentication may fail in production.");
  }

  console.log(`📂 App Router found at: ${appPath.relative}`);
  const routes = scanRoutes(appPath.absolute);

  if (routes.length === 0) {
    console.log("ℹ️ No page routes discovered.");
    return;
  }

  console.log(`Found ${routes.length} route(s):`);
  routes.forEach(r => console.log(`  - ${r.slug} (${r.type}) -> ${r.path}`));

  // Send manifest payload to Backend API
  const syncEndpoint = `${CMS_BASE_URL.replace(/\/$/, "")}/api/integrations/next-sync/manifest`;
  console.log(`📤 Sending route manifest to backend: ${syncEndpoint}...`);

  const payload = {
    siteId: SITE_ID,
    source: "auto-sync-script",
    generatedAt: new Date().toISOString(),
    routes
  };

  try {
    const res = await fetch(syncEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(INTEGRATION_KEY ? { "x-integration-key": INTEGRATION_KEY } : {})
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Sync server error code: ${res.status}`);
    }

    console.log("✅ Auto-Sync Completed Successfully!");
    console.log(`   Created: ${data.created ? data.created.length : 0} new draft route(s)`);
    console.log(`   Updated: ${data.updated ? data.updated.length : 0} existing route(s)`);
    console.log(`   Manifest Hash: ${data.manifestHash}`);
  } catch (err) {
    console.error("❌ Sync failed:", err.message);
    process.exit(1);
  }
}

// Check if this script is executed directly
const nodePath = process.argv[1] ? fs.realpathSync(process.argv[1]) : "";
const modulePath = fileURLToPath(import.meta.url);
if (nodePath === modulePath) {
  run();
}

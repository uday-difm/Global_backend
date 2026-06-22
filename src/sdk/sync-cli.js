#!/usr/bin/env node

/**
 * Universal CMS Page Discovery & Auto-Sync Hook Script
 * Scans the routing directory of ANY frontend/backend project and submits the route manifest.
 *
 * Usage:
 *   node src/sdk/sync-cli.js --config=cms-sync.config.json
 *   OR using CLI args:
 *   node src/sdk/sync-cli.js --siteId=site_id --key=apiKey --dir=src/routes --framework=sveltekit
 */

const fs = require("fs");
const path = require("path");

// Helper to parse double dash CLI arguments: --key=value
function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith("--")) {
      const parts = arg.slice(2).split("=");
      const key = parts[0];
      const value = parts.slice(1).join("=");
      args[key] = value;
    }
  });
  return args;
}

// Simple helper to load environment variables from a file if present
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const parts = trimmed.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim().replace(/(^['"]|['"]$)/g, "");
      process.env[key] = val;
    }
  });
}

async function run() {
  // Load local environments if present
  loadEnvFile(path.join(process.cwd(), ".env"));
  loadEnvFile(path.join(process.cwd(), ".env.local"));

  const cliArgs = parseArgs();

  // Determine config file path
  const configPath = cliArgs.config || "cms-sync.config.json";
  let config = {};

  if (fs.existsSync(path.join(process.cwd(), configPath))) {
    try {
      config = JSON.parse(fs.readFileSync(path.join(process.cwd(), configPath), "utf-8"));
      console.log(`📖 Loaded configuration file: ${configPath}`);
    } catch (e) {
      console.error(`❌ Error parsing configuration file: ${configPath}. Ensure JSON is valid.`);
      process.exit(1);
    }
  }

  // Merge Config sources (CLI Args > Config File > Env Variables)
  const CMS_BASE_URL =
    cliArgs.url ||
    config.cmsBaseUrl ||
    process.env.CMS_BASE_URL ||
    process.env.NEXT_PUBLIC_CMS_BASE_URL ||
    "http://localhost:3000";

  const SITE_ID =
    cliArgs.siteId ||
    config.siteId ||
    process.env.CMS_SITE_ID ||
    process.env.NEXT_PUBLIC_SITE_ID;

  const INTEGRATION_KEY =
    cliArgs.key ||
    config.key ||
    process.env.CMS_INTEGRATION_KEY;

  const FRAMEWORK =
    cliArgs.framework ||
    config.framework ||
    "other";

  const ROUTES_DIR =
    cliArgs.dir ||
    config.routesDir;

  const EXTENSIONS =
    config.extensions || [".js", ".jsx", ".tsx", ".vue", ".svelte", ".html", ".php"];

  const EXCLUDE =
    config.exclude || [];

  const STATIC_ROUTES =
    config.staticRoutes || [];

  if (!SITE_ID) {
    console.error("❌ Sync Error: Site ID is missing. Set --siteId, 'siteId' in config, or NEXT_PUBLIC_SITE_ID.");
    process.exit(1);
  }

  const routes = [];

  // Add manually defined static routes first
  if (Array.isArray(STATIC_ROUTES)) {
    STATIC_ROUTES.forEach((r) => {
      if (r.slug) {
        routes.push({
          slug: r.slug.startsWith("/") ? r.slug : `/${r.slug}`,
          path: r.path || "manual-config",
          type: r.type || "static",
          title: r.title || r.slug.replace(/^\//, ""),
        });
      }
    });
  }

  // If a directory is specified, scan it for files
  if (ROUTES_DIR) {
    const absoluteRoutesDir = path.resolve(process.cwd(), ROUTES_DIR);
    if (!fs.existsSync(absoluteRoutesDir)) {
      console.error(`❌ Sync Error: Routing directory "${ROUTES_DIR}" does not exist.`);
      process.exit(1);
    }

    console.log(`🔍 Scanning directory "${ROUTES_DIR}" for page definitions...`);
    
    // Glob helper logic
    const isExcluded = (filePath) => {
      const relative = path.relative(absoluteRoutesDir, filePath).replace(/\\/g, "/");
      return EXCLUDE.some((pattern) => {
        const regexPattern = pattern
          .replace(/\./g, "\\.")
          .replace(/\*\*/g, ".*")
          .replace(/\*/g, "[^/]*");
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(relative);
      });
    };

    const traverse = (dir) => {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          traverse(fullPath);
        } else {
          const ext = path.extname(file);
          if (EXTENSIONS.includes(ext) && !isExcluded(fullPath)) {
            // Found a matching route page file
            const relativeFilePath = path.relative(process.cwd(), fullPath).replace(/\\/g, "/");
            const folderFromBase = path.relative(absoluteRoutesDir, dir).replace(/\\/g, "/");

            let slug = "";
            let type = "static";
            let title = "";

            if (FRAMEWORK === "next") {
              // Next.js page.js inside app router folder
              if (file.toLowerCase().startsWith("page.")) {
                slug = "/" + folderFromBase
                  .split("/")
                  .filter((segment) => segment && !segment.startsWith("(") && !segment.endsWith(")"))
                  .join("/");
              } else {
                return; // Ignore other files in app router
              }
            } else if (FRAMEWORK === "nuxt") {
              // Nuxt pages/about.vue or pages/items/[id].vue
              let tempSlug = folderFromBase ? `${folderFromBase}/${path.basename(file, ext)}` : path.basename(file, ext);
              if (tempSlug.toLowerCase() === "index") {
                tempSlug = folderFromBase;
              } else if (tempSlug.endsWith("/index")) {
                tempSlug = tempSlug.slice(0, -6);
              }
              slug = "/" + tempSlug;
              // Nuxt dynamic: [id].vue or _id.vue
              if (slug.includes("[") || slug.includes("_")) {
                type = "dynamic";
              }
            } else if (FRAMEWORK === "sveltekit") {
              // SvelteKit src/routes/about/+page.svelte
              if (file === "+page.svelte") {
                slug = "/" + folderFromBase;
                if (slug.includes("[") && slug.includes("]")) {
                  type = "dynamic";
                }
              } else {
                return;
              }
            } else {
              // Generic static file scanner (e.g. php/html folder)
              let tempSlug = folderFromBase ? `${folderFromBase}/${path.basename(file, ext)}` : path.basename(file, ext);
              if (tempSlug.toLowerCase() === "index" || tempSlug.toLowerCase() === "home") {
                tempSlug = folderFromBase;
              } else if (tempSlug.endsWith("/index") || tempSlug.endsWith("/home")) {
                tempSlug = tempSlug.slice(0, -6);
              }
              slug = "/" + tempSlug;
            }

            // Sanitize slug
            slug = slug.replace(/\/+/g, "/");
            if (slug === "" || slug === "//") slug = "/";

            // Determine Title
            let slugPart = slug === "/" ? "Home" : slug.split("/").pop();
            slugPart = slugPart.replace(/[\[\]\.\+\-_]/g, ""); // Clean formatting symbols
            title = slugPart.charAt(0).toUpperCase() + slugPart.slice(1);

            // Add if not duplicate
            if (slug && !routes.some((r) => r.slug === slug)) {
              routes.push({
                slug,
                path: relativeFilePath,
                type,
                title: title || "New Page",
              });
            }
          }
        }
      });
    };

    traverse(absoluteRoutesDir);
  }

  if (routes.length === 0) {
    console.log("⚠️ No routes discovered or configured to sync.");
    return;
  }

  console.log(`🚀 Found ${routes.length} route(s) to synchronize:`);
  routes.forEach((r) => console.log(`  - ${r.slug} (${r.type}) [Source: ${r.path}]`));

  // POST routes to the generic Sync Endpoint
  const syncEndpoint = `${CMS_BASE_URL.replace(/\/$/, "")}/api/integrations/sync-routes`;
  console.log(`📤 Syncing route manifest to: ${syncEndpoint}...`);

  const payload = {
    siteId: SITE_ID,
    framework: FRAMEWORK,
    source: "sync-cli",
    generatedAt: new Date().toISOString(),
    routes,
  };

  try {
    const res = await fetch(syncEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(INTEGRATION_KEY ? { "x-integration-key": INTEGRATION_KEY } : {}),
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Sync error. Status code: ${res.status}`);
    }

    console.log("✅ Route Synchronization Successful!");
    console.log(`   Created: ${data.created ? data.created.length : 0} page(s)`);
    console.log(`   Updated: ${data.updated ? data.updated.length : 0} page(s)`);
    console.log(`   Integration Type: ${FRAMEWORK.toUpperCase()}`);
    console.log(`   Frontend Project ID: ${data.frontendProjectId}`);
  } catch (err) {
    console.error("❌ Sync failed:", err.message);
    process.exit(1);
  }
}

run();

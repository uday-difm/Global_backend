/**
 * ============================================================
 *  setup.js — Full Backend Setup Script
 * ============================================================
 *  Runs in order:
 *    1. prisma generate         — build the Prisma Client
 *    2. prisma migrate deploy   — apply all pending migrations
 *    3. prisma/seed.js          — create default site + super-admin
 *    4. seed-layman-litigation  — seed full CMS content
 * ============================================================
 *  Usage:
 *    node scripts/setup.js
 *    node scripts/setup.js --skip-migrate
 *    node scripts/setup.js --skip-seed
 *    node scripts/setup.js --skip-content-seed
 *    node scripts/setup.js --skip-migrate --skip-seed
 * ============================================================
 */

require("dotenv/config");

const { execSync, spawnSync } = require("child_process");
const path = require("path");

// ── Helpers ──────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const skipMigrate = args.includes("--skip-migrate");
const skipSeed = args.includes("--skip-seed");
const skipContentSeed = args.includes("--skip-content-seed");

function log(emoji, msg) {
  console.log(`\n${emoji}  ${msg}`);
}

function hr() {
  console.log("\n" + "─".repeat(60));
}

function run(label, cmd, opts = {}) {
  log("▶", label);
  const result = spawnSync(cmd, {
    shell: true,
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env },
    ...opts,
  });
  if (result.status !== 0) {
    console.error(`\n❌  "${label}" failed with exit code ${result.status}`);
    process.exit(result.status ?? 1);
  }
  log("✅", `${label} — done`);
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  console.log("\n" + "═".repeat(60));
  console.log("  🚀  Global Backend — Automated Setup");
  console.log("═".repeat(60));
  console.log(`  DATABASE_URL: ${process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ":***@") ?? "(not set)"}`);

  if (!process.env.DATABASE_URL) {
    console.error("\n❌  DATABASE_URL is not set. Check your 'env' file in the project root.");
    process.exit(1);
  }

  // ── Step 1: Generate Prisma Client ────────────────────────
  hr();
  run(
    "Prisma generate — building the Prisma Client",
    "npx prisma generate --schema=prisma/schema.prisma"
  );

  // ── Step 2: Run Prisma Migrations ──────────────────────────
  hr();
  if (skipMigrate) {
    log("⏭", "Skipping Prisma migrations (--skip-migrate)");
  } else {
    run(
      "Prisma migrate deploy — applying all pending migrations",
      "npx prisma migrate deploy --schema=prisma/schema.prisma"
    );
  }

  // ── Step 3: Seed Base Data (default site + super-admin) ────
  hr();
  if (skipSeed) {
    log("⏭", "Skipping base seed (--skip-seed)");
  } else {
    run(
      "Prisma seed — creating default site & super-admin",
      "node prisma/seed.js"
    );
  }

  // ── Step 4: Seed Layman Litigation CMS Content ─────────────
  hr();
  if (skipContentSeed) {
    log("⏭", "Skipping Layman Litigation content seed (--skip-content-seed)");
  } else {
    run(
      "Seeding Layman Litigation CMS content",
      "node scripts/seed-layman-litigation.js"
    );
  }

  // ── Done ───────────────────────────────────────────────────
  hr();
  console.log("\n" + "═".repeat(60));
  console.log("  🎉  Setup complete! Backend is ready.");
  console.log("═".repeat(60));
  console.log("\n  Next steps:");
  console.log("    npm run dev         — start the dev server");
  console.log("    http://localhost:3000\n");
}

main().catch((err) => {
  console.error("\n❌  Setup failed:", err.message);
  process.exit(1);
});

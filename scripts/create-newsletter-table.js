const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { Pool } = require("pg");

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Newsletter" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "siteId" TEXT NOT NULL REFERENCES "Site"(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✅ Newsletter table created");

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_newsletter_siteId ON "Newsletter"("siteId");
    `);
    console.log("✅ Newsletter index created");

    // Also add any missing columns to Service table
    try {
      await pool.query(
        `ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "faqs" JSONB;`,
      );
      console.log("✅ Added faqs column to Service");
    } catch (e) {
      console.log("faqs column may already exist");
    }

    try {
      await pool.query(
        `ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "visible" BOOLEAN DEFAULT true;`,
      );
      console.log("✅ Added visible column to Service");
    } catch (e) {
      console.log("visible column may already exist");
    }
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await pool.end();
  }
}
run();

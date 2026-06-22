import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ Error: DATABASE_URL environment variable is missing.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function runWizard() {
  const rl = readline.createInterface({ input, output });
  console.log("=========================================");
  console.log("   GLOBAL BACKEND WORKSPACE PROVISIONER  ");
  console.log("=========================================\n");

  try {
    // 1. Get Site Name
    const name = await rl.question("🔹 Enter Workspace/Site Name (e.g. Alpha Corp): ");
    if (!name.trim()) {
      console.log("❌ Error: Site name cannot be empty.");
      return;
    }

    // 2. Get Domain
    const domain = await rl.question("🔹 Enter Site Domain (optional, e.g. alpha.local): ");

    // 3. Get Custom Site ID
    const customIdInput = await rl.question("🔹 Enter Custom Site ID (optional, hit enter to auto-generate): ");
    const siteId = customIdInput.trim() || `site_${crypto.randomBytes(8).toString("hex")}`;

    // 4. Get User Email
    const email = await rl.question("🔹 Enter Owner/Editor Email to assign to this site: ");
    let targetUser = null;

    if (email.trim()) {
      targetUser = await prisma.user.findUnique({
        where: { email: email.trim() }
      });

      if (!targetUser) {
        console.log(`\nℹ️ User with email "${email}" not found.`);
        const createNew = await rl.question("❓ Do you want to create a new user for this email? (y/n): ");
        if (createNew.toLowerCase() === "y" || createNew.toLowerCase() === "yes") {
          const password = await rl.question("🔒 Enter password for the new user: ");
          if (password.length < 6) {
            console.log("❌ Error: Password must be at least 6 characters.");
            return;
          }
          console.log("Creating new user...");
          const passwordHash = await bcrypt.hash(password, 12);
          targetUser = await prisma.user.create({
            data: {
              email: email.trim(),
              passwordHash,
              globalRole: "VIEWER",
              isActive: true
            }
          });
          console.log(`✅ User "${email}" created successfully!`);
        }
      } else {
        console.log(`✅ Found existing user matching "${email}"`);
      }
    }

    console.log("\n⏳ Provisioning site configurations in the database...");
    
    // Create Site
    const site = await prisma.site.create({
      data: {
        id: siteId,
        name,
        domain: domain.trim() || null,
        isActive: true
      }
    });

    // Create default GlobalSettings
    await prisma.globalSettings.create({
      data: {
        siteId: site.id,
        websiteSettings: { title: name, domain: domain.trim() || "" },
        header: { sticky: true, logoAlign: "left", logoHeight: 40 },
        footer: { copyright: `© ${new Date().getFullYear()} ${name}. All rights reserved.` },
        navigation: { links: [{ label: "Home", url: "/" }] }
      }
    });

    // Create default FrontendProject
    const project = await prisma.frontendProject.create({
      data: {
        siteId: site.id,
        name: `${name} NextJS App`,
        framework: "next",
        apiKey: `key_${crypto.randomBytes(16).toString("hex")}`,
        syncStatus: "disconnected"
      }
    });

    // Auto-generate initial Integration Manifest & default draft pages
    const defaultRoutes = [
      { slug: "/", path: "app/page.jsx", type: "static", title: "Home" },
      { slug: "/about", path: "app/about/page.jsx", type: "static", title: "About" },
      { slug: "/services", path: "app/services/page.jsx", type: "static", title: "Services" },
      { slug: "/blog", path: "app/blog/page.jsx", type: "static", title: "Blog" },
      { slug: "/contact", path: "app/contact/page.jsx", type: "static", title: "Contact" }
    ];

    const manifestHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(defaultRoutes))
      .digest("hex");

    const rawJson = {
      siteId: site.id,
      source: "provision-wizard",
      generatedAt: new Date().toISOString(),
      routes: defaultRoutes
    };

    await prisma.integrationManifest.create({
      data: {
        siteId: site.id,
        source: "provision-wizard",
        manifestHash,
        rawJson
      }
    });

    for (const r of defaultRoutes) {
      const page = await prisma.page.create({
        data: {
          siteId: site.id,
          title: r.title,
          slug: r.slug,
          status: "DRAFT",
          isDiscovered: true,
          isManagedBySync: true,
          sourceRoute: r.slug
        }
      });

      await prisma.syncedRoute.create({
        data: {
          frontendProjectId: project.id,
          route: r.slug,
          source: r.path,
          pageId: page.id
        }
      });
    }

    await prisma.frontendProject.update({
      where: { id: project.id },
      data: {
        lastSyncAt: new Date(),
        lastManifestHash: manifestHash,
        syncStatus: "connected"
      }
    });

    // Map User to Site
    if (targetUser) {
      await prisma.siteUser.create({
        data: {
          siteId: site.id,
          userId: targetUser.id,
          role: "ADMIN"
        }
      });
      console.log(`✅ Linked user "${targetUser.email}" to site as ADMIN!`);
    }

    console.log("\n=========================================");
    console.log("🎉 WORKSPACE PROVISIONED SUCCESSFULLY!");
    console.log("=========================================");
    console.log("Site ID:       ", site.id);
    console.log("Site Name:     ", site.name);
    console.log("Domain:        ", site.domain || "Not specified");
    console.log("SDK API Key:   ", project.apiKey);
    console.log("=========================================");
    console.log("Copy the environment keys below to your frontend's .env.local:\n");
    console.log(`NEXT_PUBLIC_SITE_ID=${site.id}`);
    console.log(`CMS_INTEGRATION_KEY=${project.apiKey}`);
    console.log("=========================================\n");

  } catch (err) {
    console.error("\n❌ Setup Wizard failed:", err.message);
  } finally {
    rl.close();
    await prisma.$disconnect();
    await pool.end();
  }
}

runWizard();

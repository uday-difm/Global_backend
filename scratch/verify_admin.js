require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function runFullVerification() {
  console.log("--- Starting Full Admin Access & Roles Verification ---");
  let testUser;

  try {
    // 1. Add User & Password Management
    testUser = await prisma.user.create({
      data: {
        email: `admin-test-${Date.now()}@example.com`,
        passwordHash: "secure-hash-placeholder",
        globalRole: "ADMIN",
      },
    });
    console.log("✅ [User Management] Added:", testUser.email);

    // 2. Assign Roles (Update Global Role)
    await prisma.user.update({
      where: { id: testUser.id },
      data: { globalRole: "EDITOR" },
    });
    console.log("✅ [Roles] Updated Global Role to EDITOR");

    // 3. Login History
    await prisma.loginHistory.create({
      data: {
        userId: testUser.id,
        ipAddress: "127.0.0.1",
        userAgent: "Test-Agent",
      },
    });
    console.log("✅ [Login History] Recorded login");

    // 4. 2FA Setup
    const tfa = await prisma.twoFactor.create({
      data: { userId: testUser.id, secret: "MOCK_SECRET" },
    });
    console.log("✅ [2FA] Enabled for user");

    // 5. Verification Check
    const fullUser = await prisma.user.findUnique({
      where: { id: testUser.id },
      include: { loginHistory: true, twoFactor: true },
    });

    if (
      fullUser.globalRole === "EDITOR" &&
      fullUser.loginHistory.length > 0 &&
      fullUser.twoFactor
    ) {
      console.log("🎉 SUCCESS: All Admin features verified!");
    }

    // 6. Cleanup (Remove User + Relations)
    await prisma.twoFactor.delete({ where: { userId: testUser.id } });
    await prisma.loginHistory.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log("✅ [Cleanup] User removed successfully.");
  } catch (error) {
    console.error("❌ Verification Failed:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

runFullVerification();

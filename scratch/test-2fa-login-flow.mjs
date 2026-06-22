/**
 * 2FA Sign-In Flow Verification Script
 * Validates check API endpoints, NextAuth credential provider rules, and TOTP checks.
 * 
 * Usage:
 *   node scratch/test-2fa-login-flow.mjs
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import http from "http";
import dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:123@localhost:5432/global_backend";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const BASE_URL = "http://localhost:3000";
const TEST_EMAIL = "test2fa_user@example.com";
const TEST_PASSWORD = "super_secure_password_123";

async function request(method, urlPath, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const options = {
      method: method.toUpperCase(),
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        "Content-Type": "application/json",
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data, headers: res.headers });
        }
      });
    });

    req.on("error", (e) => reject(e));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function verify2FALoginFlow() {
  console.log("====================================================");
  console.log("   STARTING TWO-FACTOR AUTHENTICATION LOGIN TESTS   ");
  console.log("====================================================\n");

  let failures = 0;
  const assert = (condition, message) => {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failures++;
    }
  };

  let testUser = null;

  try {
    // 1. Setup Test User
    console.log("1. Creating test user in database...");
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
    
    testUser = await prisma.user.upsert({
      where: { email: TEST_EMAIL },
      update: { passwordHash, twoFAEnabled: false, isActive: true },
      create: { email: TEST_EMAIL, passwordHash, twoFAEnabled: false, isActive: true }
    });
    assert(testUser.id !== undefined, "Test user record successfully set up");

    // 2. Validate API 2FA Check Before Enabling
    console.log("\n2. Testing /api/auth/2fa/check (2FA disabled)...");
    const checkDisabled = await request("POST", "/api/auth/2fa/check", {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    assert(checkDisabled.status === 200, "2FA check API accepts correct credentials (200)");
    assert(checkDisabled.twoFaRequired === undefined || checkDisabled.data.twoFaRequired === false, "Reports 2FA is NOT required");

    // Test bad credentials on 2FA check API (should return unauthorized)
    const checkBadCreds = await request("POST", "/api/auth/2fa/check", {
      email: TEST_EMAIL,
      password: "wrong_password"
    });
    assert(checkBadCreds.status === 401, "2FA check API rejects invalid password (401)");

    // 3. Enable 2FA Setup
    console.log("\n3. Provisioning 2FA secret and enabling 2FA for the test user...");
    const secret = speakeasy.generateSecret({ length: 20 });
    
    await prisma.twoFactor.upsert({
      where: { userId: testUser.id },
      update: { secret: secret.base32 },
      create: { userId: testUser.id, secret: secret.base32 }
    });

    await prisma.user.update({
      where: { id: testUser.id },
      data: { twoFAEnabled: true }
    });
    console.log("2FA successfully enabled in DB.");

    // 4. Validate API 2FA Check After Enabling
    console.log("\n4. Testing /api/auth/2fa/check (2FA active)...");
    const checkEnabled = await request("POST", "/api/auth/2fa/check", {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    assert(checkEnabled.status === 200, "2FA check API accepts correct credentials (200)");
    assert(checkEnabled.data.twoFaRequired === true, "Correctly reports 2FA IS required");

    // 5. Test NextAuth Authorize Flow Verification (Programmatically)
    console.log("\n5. Testing NextAuth authorize logic programmatically...");
    const { authOptions } = await import("../src/lib/auth.js");
    const credentialsProvider = authOptions.providers.find(p => p.id === "credentials");

    // Scenario A: Without TOTP code
    try {
      await credentialsProvider.authorize({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      }, { headers: {} });
      assert(false, "Should have thrown 2FA_REQUIRED error");
    } catch (err) {
      assert(err.message === "2FA_REQUIRED", "Correctly throws 2FA_REQUIRED when token is missing");
    }

    // Scenario B: With incorrect TOTP code
    try {
      await credentialsProvider.authorize({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        totpCode: "000000"
      }, { headers: {} });
      assert(false, "Should have thrown invalid code error");
    } catch (err) {
      assert(err.message === "Invalid verification code", "Correctly rejects wrong TOTP verification code");
    }

    // Scenario C: With correct TOTP code
    const validToken = speakeasy.totp({
      secret: secret.base32,
      encoding: "base32"
    });

    const sessionUser = await credentialsProvider.authorize({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      totpCode: validToken
    }, { headers: {} });

    assert(sessionUser !== null && sessionUser.email === TEST_EMAIL, "Successfully authenticates and returns user session with correct TOTP code");

  } catch (error) {
    console.error("Test execution failed with error:", error);
    failures++;
  } finally {
    // Cleanup
    if (testUser) {
      console.log("\nCleaning up verification records...");
      await prisma.twoFactor.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    }
    await prisma.$disconnect();
    await pool.end();
  }

  console.log("\n====================================================");
  if (failures === 0) {
    console.log("🎉 ALL TWO-FACTOR LOGIN FLOW FUNCTIONALITIES VERIFIED SUCCESSFULLY!");
  } else {
    console.log(`❌ 2FA VERIFICATION FINISHED WITH ${failures} FAILURE(S).`);
  }
  console.log("====================================================");
}

verify2FALoginFlow();

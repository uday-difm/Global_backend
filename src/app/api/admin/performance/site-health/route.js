import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSitePermission } from "@/lib/apiAuth";

export async function GET(req) {
  const auth = await checkSitePermission(req, "ADMIN");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const start = Date.now();
  let dbStatus = "Offline";
  let dbPingTime = null;

  try {
    // Ping database
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "Connected";
    dbPingTime = `${Date.now() - start}ms`;
  } catch (err) {
    console.error("DB Ping Error:", err);
  }

  // Check Cloudinary configs
  const cloudinaryStatus = (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) ? "Configured" : "Not Configured";

  // Check Env configurations
  const nextAuthUrl = process.env.NEXTAUTH_URL || "Not set";

  return NextResponse.json({
    success: true,
    status: dbStatus === "Connected" ? "healthy" : "degraded",
    checks: {
      database: {
        status: dbStatus,
        latency: dbPingTime
      },
      cloudinary: {
        status: cloudinaryStatus
      },
      environment: {
        nextAuthUrl,
        nodeEnv: process.env.NODE_ENV
      }
    },
    responseTime: `${Date.now() - start}ms`
  });
}

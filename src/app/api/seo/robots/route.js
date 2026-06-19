import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return new Response("User-agent: *\nAllow: /", {
        headers: { "Content-Type": "text/plain" }
      });
    }

    const settings = await prisma.globalSettings.findUnique({
      where: { siteId },
      select: { scripts: true }
    });

    const scripts = settings?.scripts || {};
    const robotsText = scripts.robotsTxt || "User-agent: *\nAllow: /";

    return new Response(robotsText, {
      headers: { "Content-Type": "text/plain" }
    });
  } catch (err) {
    return new Response("User-agent: *\nAllow: /", {
      headers: { "Content-Type": "text/plain" }
    });
  }
}

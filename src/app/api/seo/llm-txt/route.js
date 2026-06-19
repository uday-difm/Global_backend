import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return new Response("# Global CMS Site\nWelcome to this site. Read the documentation at /docs", {
        headers: { "Content-Type": "text/plain" }
      });
    }

    const settings = await prisma.globalSettings.findUnique({
      where: { siteId },
      select: { scripts: true }
    });

    const scripts = settings?.scripts || {};
    const llmTxt = scripts.llmTxt || `# Global CMS Site Tenant\nThis site contains blog posts, pages, and services.`;

    return new Response(llmTxt, {
      headers: { "Content-Type": "text/plain" }
    });
  } catch (err) {
    return new Response("# Error fetching llms.txt", {
      headers: { "Content-Type": "text/plain" }
    });
  }
}

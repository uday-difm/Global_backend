import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { z } from "zod";
import { logAction } from "@/lib/audit"; // optional; will be used if present

const SettingsSchema = z.object({
  siteId: z.string().min(1),
  header: z.any().optional(),
  footer: z.any().optional(),
  analytics: z.any().optional(),
  scripts: z.any().optional(),
});

export async function POST(request) {
  try {
    let authUser = await requireAuth();
    if (!authUser && process.env.NODE_ENV === "development") {
      authUser = await prisma.user.findFirst();
      if (!authUser) {
        return NextResponse.json(
          { error: "Unauthorized (no dev user)" },
          { status: 401 },
        );
      }
    }
    if (!authUser || !["SUPERADMIN", "ADMIN"].includes(authUser.globalRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = SettingsSchema.parse(body);

    const result = await prisma.globalSettings.upsert({
      where: { siteId: data.siteId },
      update: {
        header: data.header ?? null,
        footer: data.footer ?? null,
        analytics: data.analytics ?? null,
        scripts: data.scripts ?? null,
      },
      create: {
        siteId: data.siteId,
        header: data.header ?? null,
        footer: data.footer ?? null,
        analytics: data.analytics ?? null,
        scripts: data.scripts ?? null,
      },
    });

    // optional audit log
    try {
      if (typeof logAction === "function") {
        await logAction(result.id, authUser.id, "GLOBAL_SETTINGS_UPDATED", {
          siteId: data.siteId,
        });
      }
    } catch (e) {
      console.warn("Audit log failed:", e);
    }

    return NextResponse.json({ ok: true, settings: result }, { status: 200 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("POST /api/admin/global-settings error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

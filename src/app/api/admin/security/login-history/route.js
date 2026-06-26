import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSitePermission } from "@/lib/apiAuth";
import { apiSuccess } from "@/core/errors";

export async function GET(req) {
  const auth = await checkSitePermission(req, "ADMIN");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const history = await prisma.loginHistory.findMany({
      where: { siteId: auth.siteId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: {
          select: {
            email: true,
            globalRole: true,
          },
        },
      },
    });

    return NextResponse.json(apiSuccess({ loginHistory: history }));
  } catch (error) {
    console.error("Login History API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

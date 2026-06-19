import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

async function checkAdminAuth() {
  const user = await requireAuth();
  const isDev = process.env.NODE_ENV === "development";

  let caller = user;
  if (!caller && isDev) {
    caller = await prisma.user.findFirst();
    if (caller) {
      caller = { ...caller, globalRole: "SUPERADMIN" };
    }
  }

  if (!caller) return { error: "Unauthorized", status: 401 };

  if (caller.globalRole !== "SUPERADMIN" && caller.globalRole !== "ADMIN") {
    return { error: "Forbidden: Admin access required", status: 403 };
  }

  return { user: caller };
}

export async function GET(req) {
  const auth = await checkAdminAuth();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const history = await prisma.loginHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 100, // Return the last 100 logs
      include: {
        user: {
          select: {
            email: true,
            globalRole: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, loginHistory: history });
  } catch (error) {
    console.error("Login History API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

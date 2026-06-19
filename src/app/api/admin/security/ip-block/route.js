import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSitePermission } from "@/lib/apiAuth";

export async function POST(req) {
  const auth = await checkSitePermission(req, "ADMIN");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { ip } = await req.json();
    if (!ip) {
      return NextResponse.json({ error: "ip address is required" }, { status: 400 });
    }

    const settings = await prisma.globalSettings.findUnique({
      where: { siteId: auth.siteId },
      select: { securityControls: true }
    });

    const controls = settings?.securityControls || {};
    const ipBlocklist = controls.ipBlocklist || [];

    if (!ipBlocklist.includes(ip)) {
      ipBlocklist.push(ip);
    }

    await prisma.globalSettings.update({
      where: { siteId: auth.siteId },
      data: {
        securityControls: {
          ...controls,
          ipBlocklist
        }
      }
    });

    return NextResponse.json({ success: true, message: `IP ${ip} blocked successfully`, ipBlocklist });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  const auth = await checkSitePermission(req, "ADMIN");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const ip = searchParams.get("ip");

    if (!ip) {
      return NextResponse.json({ error: "ip parameter is required" }, { status: 400 });
    }

    const settings = await prisma.globalSettings.findUnique({
      where: { siteId: auth.siteId },
      select: { securityControls: true }
    });

    const controls = settings?.securityControls || {};
    const ipBlocklist = controls.ipBlocklist || [];

    const updatedBlocklist = ipBlocklist.filter(item => item !== ip);

    await prisma.globalSettings.update({
      where: { siteId: auth.siteId },
      data: {
        securityControls: {
          ...controls,
          ipBlocklist: updatedBlocklist
        }
      }
    });

    return NextResponse.json({ success: true, message: `IP ${ip} unblocked successfully`, ipBlocklist: updatedBlocklist });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}

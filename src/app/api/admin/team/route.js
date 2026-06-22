import { NextResponse } from "next/server";
import { teamMemberService } from "@/services/teamMember.service";
import { checkSitePermission } from "@/lib/apiAuth";
import { handleApiError } from "@/core/errors";

export async function GET(req) {
  try {
    const auth = await checkSitePermission(req, "EDITOR");
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const team = await teamMemberService.getTeamMembers(auth.siteId);
    return NextResponse.json({ success: true, teamMembers: team });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req) {
  try {
    const auth = await checkSitePermission(req, "EDITOR");
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const teamMember = await teamMemberService.create(auth.siteId, body, auth.user.id);

    return NextResponse.json({ success: true, teamMember }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

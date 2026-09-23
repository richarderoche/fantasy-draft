import { NextResponse } from "next/server";
import { getKv, isKvConfigured } from "@/app/lib/kv";
import { tribeAssignmentsKey } from "@/app/lib/kv-keys";
import { parseTribeAssignmentPayload } from "@/app/lib/tribe-payload";

export const dynamic = "force-dynamic";

const ROBOTS = { "X-Robots-Tag": "noindex, nofollow, noarchive" };

export async function GET() {
  if (!isKvConfigured()) {
    return NextResponse.json(
      { assignments: {} },
      { headers: ROBOTS },
    );
  }

  try {
    const stored = await getKv().get<Record<string, string>>(
      tribeAssignmentsKey(),
    );
    return NextResponse.json(
      { assignments: stored ?? {} },
      { headers: ROBOTS },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to load tribe assignments" },
      { status: 500, headers: ROBOTS },
    );
  }
}

export async function PUT(request: Request) {
  if (!isKvConfigured()) {
    return NextResponse.json(
      { error: "Storage is not configured on this deployment" },
      { status: 503, headers: ROBOTS },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400, headers: ROBOTS },
    );
  }

  const assignments = parseTribeAssignmentPayload(body);
  if (!assignments) {
    return NextResponse.json(
      { error: "Invalid tribe assignment payload" },
      { status: 400, headers: ROBOTS },
    );
  }

  try {
    await getKv().set(tribeAssignmentsKey(), assignments);
    return NextResponse.json({ ok: true }, { headers: ROBOTS });
  } catch {
    return NextResponse.json(
      { error: "Failed to save tribe assignments" },
      { status: 500, headers: ROBOTS },
    );
  }
}

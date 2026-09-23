import { NextResponse } from "next/server";
import { getKv, isKvConfigured } from "@/app/lib/kv";
import { leagueDraftKey } from "@/app/lib/kv-keys";
import {
  emptyLeagueDraft,
  parseLeagueDraftPayload,
  type LeagueDraftPayload,
} from "@/app/lib/league-draft";
import { normalizeLeagueSlug } from "@/app/lib/league-slug";

export const dynamic = "force-dynamic";

const ROBOTS = { "X-Robots-Tag": "noindex, nofollow, noarchive" };

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { slug: rawSlug } = await context.params;
  const slug = normalizeLeagueSlug(rawSlug);
  if (!slug) {
    return NextResponse.json(
      { error: "Invalid league slug" },
      { status: 400, headers: ROBOTS },
    );
  }

  if (!isKvConfigured()) {
    return NextResponse.json(emptyLeagueDraft(), { headers: ROBOTS });
  }

  try {
    const stored = await getKv().get<LeagueDraftPayload>(leagueDraftKey(slug));
    if (!stored) {
      return NextResponse.json(emptyLeagueDraft(), { headers: ROBOTS });
    }
    const parsed = parseLeagueDraftPayload(stored);
    return NextResponse.json(parsed ?? emptyLeagueDraft(), { headers: ROBOTS });
  } catch {
    return NextResponse.json(
      { error: "Failed to load league draft" },
      { status: 500, headers: ROBOTS },
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const { slug: rawSlug } = await context.params;
  const slug = normalizeLeagueSlug(rawSlug);
  if (!slug) {
    return NextResponse.json(
      { error: "Invalid league slug" },
      { status: 400, headers: ROBOTS },
    );
  }

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

  const draft = parseLeagueDraftPayload(body);
  if (!draft) {
    return NextResponse.json(
      { error: "Invalid draft payload" },
      { status: 400, headers: ROBOTS },
    );
  }

  try {
    await getKv().set(leagueDraftKey(slug), draft);
    return NextResponse.json({ ok: true }, { headers: ROBOTS });
  } catch {
    return NextResponse.json(
      { error: "Failed to save league draft" },
      { status: 500, headers: ROBOTS },
    );
  }
}

import type { DraftStatus } from "@/app/lib/draft-status";

export type LeagueDraftPayload = {
  statusByName: Record<string, DraftStatus>;
  myTeamOrder: string[];
};

export function emptyLeagueDraft(): LeagueDraftPayload {
  return { statusByName: {}, myTeamOrder: [] };
}

export function parseLeagueDraftPayload(body: unknown): LeagueDraftPayload | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const statusRaw = record.statusByName;
  const orderRaw = record.myTeamOrder;

  if (!statusRaw || typeof statusRaw !== "object") return null;
  if (!Array.isArray(orderRaw)) return null;

  const statusByName: Record<string, DraftStatus> = {};
  for (const [name, status] of Object.entries(
    statusRaw as Record<string, unknown>,
  )) {
    if (
      status === "my-team" ||
      status === "taken" ||
      status === "available"
    ) {
      statusByName[name] = status;
    }
  }

  const myTeamOrder = orderRaw.filter(
    (item): item is string => typeof item === "string",
  );

  return { statusByName, myTeamOrder };
}

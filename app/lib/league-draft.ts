import {
  reconcileTakenOrder,
  type DraftStatus,
} from "@/app/lib/draft-status";

export type LeagueDraftPayload = {
  statusByName: Record<string, DraftStatus>;
  myTeamOrder: string[];
  takenOrder: string[];
};

export function emptyLeagueDraft(): LeagueDraftPayload {
  return { statusByName: {}, myTeamOrder: [], takenOrder: [] };
}

export function parseLeagueDraftPayload(body: unknown): LeagueDraftPayload | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const statusRaw = record.statusByName;
  const myTeamOrderRaw = record.myTeamOrder;
  const takenOrderRaw = record.takenOrder;

  if (!statusRaw || typeof statusRaw !== "object") return null;
  if (!Array.isArray(myTeamOrderRaw)) return null;

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

  const myTeamOrder = myTeamOrderRaw.filter(
    (item): item is string => typeof item === "string",
  );

  const takenOrder = Array.isArray(takenOrderRaw)
    ? takenOrderRaw.filter((item): item is string => typeof item === "string")
    : reconcileTakenOrder(statusByName, []);

  return { statusByName, myTeamOrder, takenOrder };
}

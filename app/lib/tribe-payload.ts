import type { TribeId } from "@/app/lib/tribe-assignment";

export type TribeAssignmentPayload = Partial<Record<string, TribeId>>;

export function parseTribeAssignmentPayload(
  body: unknown,
): TribeAssignmentPayload | null {
  if (!body || typeof body !== "object") return null;

  const record = body as Record<string, unknown>;
  const raw =
    "assignments" in record && record.assignments
      ? record.assignments
      : record;

  if (!raw || typeof raw !== "object") return null;

  const assignments: TribeAssignmentPayload = {};
  for (const [name, tribeId] of Object.entries(raw as Record<string, unknown>)) {
    if (tribeId === "savu" || tribeId === "toka") {
      assignments[name] = tribeId;
    }
  }
  return assignments;
}

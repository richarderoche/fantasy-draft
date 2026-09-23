import type { Tribe } from "@/app/lib/tribes";

export const TRIBE_ASSIGNMENT_STORAGE_KEY =
  "fantasy-survivor-s51-tribe-assignment";

export type TribeId = Tribe["id"];

export type TribeFilter = "all" | TribeId;

export function readTribeAssignmentMap(): Partial<Record<string, TribeId>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(TRIBE_ASSIGNMENT_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Partial<Record<string, TribeId>>;
  } catch {
    return {};
  }
}

export function resolvePlayerTribe(
  map: Partial<Record<string, TribeId>>,
  playerName: string,
): TribeId | null {
  return map[playerName] ?? null;
}

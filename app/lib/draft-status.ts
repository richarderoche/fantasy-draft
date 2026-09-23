export type DraftStatus = "my-team" | "taken" | "available";

export type DraftStatusFilter = DraftStatus | "all";

export const DRAFT_STATUS_STORAGE_KEY = "fantasy-survivor-s51-draft-status";
export const MY_TEAM_ORDER_STORAGE_KEY = "fantasy-survivor-s51-my-team-order";
export const TAKEN_ORDER_STORAGE_KEY = "fantasy-survivor-s51-taken-order";

export function readDraftStatusMap(): Record<string, DraftStatus> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DRAFT_STATUS_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, DraftStatus>;
  } catch {
    return {};
  }
}

export function readMyTeamOrder(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MY_TEAM_ORDER_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function readTakenOrder(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TAKEN_ORDER_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

/** Drop stale names, append picks missing from order (legacy data). */
export function reconcilePickOrder(
  statusByName: Record<string, DraftStatus>,
  order: string[],
  forStatus: Exclude<DraftStatus, "available">,
): string[] {
  const matching = new Set(
    Object.entries(statusByName)
      .filter(([, status]) => status === forStatus)
      .map(([name]) => name),
  );

  const next = order.filter((name) => matching.has(name));
  const inOrder = new Set(next);
  for (const name of matching) {
    if (!inOrder.has(name)) next.push(name);
  }
  return next;
}

export function reconcileMyTeamOrder(
  statusByName: Record<string, DraftStatus>,
  order: string[],
): string[] {
  return reconcilePickOrder(statusByName, order, "my-team");
}

export function reconcileTakenOrder(
  statusByName: Record<string, DraftStatus>,
  order: string[],
): string[] {
  return reconcilePickOrder(statusByName, order, "taken");
}

export function defaultDraftStatus(): DraftStatus {
  return "available";
}

export function resolveDraftStatus(
  map: Record<string, DraftStatus>,
  playerName: string,
): DraftStatus {
  return map[playerName] ?? defaultDraftStatus();
}

export function sortCastByPickOrder<T extends { name: string }>(
  players: T[],
  pickOrder: string[],
): T[] {
  const pickIndex = new Map(pickOrder.map((name, index) => [name, index]));
  return [...players].sort(
    (a, b) =>
      (pickIndex.get(a.name) ?? Number.MAX_SAFE_INTEGER) -
      (pickIndex.get(b.name) ?? Number.MAX_SAFE_INTEGER),
  );
}

/** @deprecated use sortCastByPickOrder */
export const sortCastByMyTeamPickOrder = sortCastByPickOrder;

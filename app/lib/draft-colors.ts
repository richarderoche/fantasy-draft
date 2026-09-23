import type { DraftStatus } from "@/app/lib/draft-status";

/** Light fills — black text on buttons and cards */
export const DRAFT_PICK_COLORS: Record<
  Exclude<DraftStatus, "available">,
  string
> = {
  "my-team": "#BFDBFE",
  taken: "#FBCFE8",
};

/** Pick-order badge on filtered views */
export const DRAFT_PICK_BADGE_COLORS: Record<
  Exclude<DraftStatus, "available">,
  string
> = {
  "my-team": "#2563EB",
  taken: "#DB2777",
};

export function draftPickColor(
  status: DraftStatus,
): string | undefined {
  if (status === "available") return undefined;
  return DRAFT_PICK_COLORS[status];
}

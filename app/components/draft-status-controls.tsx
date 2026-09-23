"use client";

import type { DraftStatus } from "@/app/lib/draft-status";
import { DRAFT_PICK_COLORS } from "@/app/lib/draft-colors";

const SOLO_LABELS: Record<Exclude<DraftStatus, "available">, string> = {
  "my-team": "My Team",
  taken: "Taken",
};

const LEAGUE_LABELS: Record<Exclude<DraftStatus, "available">, string> = {
  "my-team": "Richard",
  taken: "Kelsey",
};

function draftOptionLabels(leagueView: boolean) {
  return leagueView ? LEAGUE_LABELS : SOLO_LABELS;
}

export function draftPickLabel(
  status: Exclude<DraftStatus, "available">,
  leagueView: boolean,
): string {
  return draftOptionLabels(leagueView)[status];
}

type DraftStatusControlsProps = {
  value: DraftStatus;
  onChange: (status: DraftStatus) => void;
  stopCardClick?: boolean;
  leagueView?: boolean;
};

export function DraftStatusControls({
  value,
  onChange,
  stopCardClick = false,
  leagueView = false,
}: DraftStatusControlsProps) {
  const labels = draftOptionLabels(leagueView);
  const allOptions = (
    Object.keys(labels) as Exclude<DraftStatus, "available">[]
  ).map((valueKey) => ({
    value: valueKey,
    label: labels[valueKey],
    color: DRAFT_PICK_COLORS[valueKey],
  }));

  const visibleOptions =
    value === "available"
      ? allOptions
      : allOptions.filter((opt) => opt.value === value);

  const widthClass =
    visibleOptions.length === 1 ? "w-full" : "w-1/2";

  return (
    <div
      className="flex w-full gap-2"
      role="group"
      aria-label="Draft status"
    >
      {visibleOptions.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            title={active ? `${opt.label} — click to clear` : opt.label}
            style={{ backgroundColor: opt.color }}
            className={`flex ${widthClass} min-w-0 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold text-zinc-900 transition-[box-shadow,opacity] focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${
              active
                ? "ring-2 ring-inset ring-zinc-800/70"
                : "ring-1 ring-inset ring-zinc-900/10 hover:opacity-90"
            }`}
            onClick={(e) => {
              if (stopCardClick) e.stopPropagation();
              onChange(active ? "available" : opt.value);
            }}
          >
            <span>{opt.label}</span>
            {active ? (
              <span className="text-base leading-none opacity-80" aria-hidden>
                ×
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

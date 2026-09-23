"use client";

import type { DraftStatus } from "@/app/lib/draft-status";

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

function buttonClass(
  active: boolean,
  value: Exclude<DraftStatus, "available">,
): string {
  const base =
    "flex w-1/2 min-w-0 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400";

  if (!active) {
    return `${base} bg-zinc-100 text-zinc-700 hover:bg-zinc-200`;
  }

  if (value === "my-team") {
    return `${base} bg-emerald-600 text-white hover:bg-emerald-700`;
  }
  return `${base} bg-zinc-700 text-white hover:bg-zinc-800`;
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
  const options = (
    Object.keys(labels) as Exclude<DraftStatus, "available">[]
  ).map((valueKey) => ({ value: valueKey, label: labels[valueKey] }));

  return (
    <div
      className="flex w-full gap-2"
      role="group"
      aria-label="Draft status"
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            title={active ? `${opt.label} — click to clear` : opt.label}
            className={buttonClass(active, opt.value)}
            onClick={(e) => {
              if (stopCardClick) e.stopPropagation();
              onChange(active ? "available" : opt.value);
            }}
          >
            <span>{opt.label}</span>
            {active ? (
              <span className="text-base leading-none opacity-90" aria-hidden>
                ×
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

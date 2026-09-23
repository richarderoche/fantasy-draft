"use client";

import type { DraftStatus } from "@/app/lib/draft-status";

const OPTIONS: { value: Exclude<DraftStatus, "available">; label: string }[] =
  [
    { value: "my-team", label: "My Team" },
    { value: "taken", label: "Taken" },
  ];

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
};

export function DraftStatusControls({
  value,
  onChange,
  stopCardClick = false,
}: DraftStatusControlsProps) {
  return (
    <div
      className="flex w-full gap-2"
      role="group"
      aria-label="Draft status"
    >
      {OPTIONS.map((opt) => {
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

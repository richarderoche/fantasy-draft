"use client";

import type { Tribe } from "@/app/lib/tribes";
import type { TribeId } from "@/app/lib/tribe-assignment";

type TribeControlsProps = {
  tribes: Tribe[];
  value: TribeId | null;
  onChange: (tribeId: TribeId | null) => void;
  stopCardClick?: boolean;
};

export function TribeControls({
  tribes,
  value,
  onChange,
  stopCardClick = false,
}: TribeControlsProps) {
  const visibleTribes = value
    ? tribes.filter((tribe) => tribe.id === value)
    : tribes;

  const widthClass =
    visibleTribes.length === 1
      ? "w-full"
      : visibleTribes.length === 2
        ? "w-1/2"
        : visibleTribes.length === 3
          ? "w-1/3"
          : "flex-1";

  return (
    <div className="flex w-full gap-2" role="group" aria-label="Tribe">
      {visibleTribes.map((tribe) => {
        const active = value === tribe.id;
        return (
          <button
            key={tribe.id}
            type="button"
            aria-pressed={active}
            title={active ? `${tribe.name} — click to clear` : tribe.name}
            style={{ backgroundColor: tribe.color }}
            className={`flex ${widthClass} min-w-0 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold text-zinc-900 transition-[box-shadow,opacity] focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${
              active
                ? "ring-2 ring-inset ring-zinc-800/70"
                : "ring-1 ring-inset ring-zinc-900/10 hover:opacity-90"
            }`}
            onClick={(e) => {
              if (stopCardClick) e.stopPropagation();
              onChange(active ? null : (tribe.id as TribeId));
            }}
          >
            <span>{tribe.name}</span>
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

"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DraftStatusControls } from "./draft-status-controls";
import { TribeControls } from "./tribe-controls";
import {
  type DraftStatus,
  type DraftStatusFilter,
  DRAFT_STATUS_STORAGE_KEY,
  MY_TEAM_ORDER_STORAGE_KEY,
  readDraftStatusMap,
  readMyTeamOrder,
  reconcileMyTeamOrder,
  resolveDraftStatus,
  sortCastByMyTeamPickOrder,
} from "@/app/lib/draft-status";
import {
  readTribeAssignmentMap,
  resolvePlayerTribe,
  TRIBE_ASSIGNMENT_STORAGE_KEY,
  type TribeFilter,
  type TribeId,
} from "@/app/lib/tribe-assignment";
import { clearPersistedCastData } from "@/app/lib/local-persist";
import { getTribeById, TRIBES, type Tribe } from "@/app/lib/tribes";

export type Player = {
  name: string;
  age: number;
  place: string;
  occupation: string;
  words: string;
  bio: string;
  headshot: string;
  photo: string;
};

type CardControlMode = "draft" | "tribe";

function titleCaseWord(word: string): string {
  const trimmed = word.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

function parseWords(words: string): string[] {
  return words
    .split(",")
    .map((w) => titleCaseWord(w))
    .filter(Boolean);
}

/** State / region only — for compact grid lines (lightbox keeps full `place`). */
function gridPlaceStates(place: string): string {
  const segments = place.split("/").flatMap((part) =>
    part.split(/\s+and\s+/i).map((s) => s.trim()),
  );

  const regions: string[] = [];
  for (const segment of segments) {
    if (!segment) continue;
    const region = regionFromLocality(segment);
    if (region && !regions.includes(region)) regions.push(region);
  }

  return regions.length > 0 ? regions.join(" / ") : place;
}

function regionFromLocality(locality: string): string {
  const trimmed = locality.trim();
  if (!trimmed.includes(",")) {
    if (/^new york city$/i.test(trimmed)) return "N.Y.";
    return "";
  }

  const parts = trimmed.split(",").map((p) => p.trim());
  const last = parts[parts.length - 1];
  if (last === "Canada" && parts.length >= 2) return parts[parts.length - 2];
  if (last === "USA" && parts.length >= 2) return parts[parts.length - 2];
  return last;
}

function WordPills({ words }: { words: string }) {
  const items = parseWords(words);
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {items.map((word) => (
        <li
          key={word}
          className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-medium text-white"
        >
          {word}
        </li>
      ))}
    </ul>
  );
}

function FilterLabel({
  label,
  count,
  totalCount,
}: {
  label: string;
  count: number;
  totalCount: number;
}) {
  return (
    <span className="font-medium text-zinc-700">
      {label}{" "}
      <span className="font-normal tabular-nums text-zinc-500">
        {count}/{totalCount}
      </span>
    </span>
  );
}

function modeButtonClass(active: boolean): string {
  const base =
    "rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400";
  return active
    ? `${base} bg-zinc-900 text-white`
    : `${base} bg-zinc-100 text-zinc-700 hover:bg-zinc-200`;
}

function ResetConfirmDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="reset-dialog-title"
      aria-describedby="reset-dialog-desc"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Cancel"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h2
          id="reset-dialog-title"
          className="text-lg font-semibold text-zinc-900"
        >
          Reset saved data?
        </h2>
        <p id="reset-dialog-desc" className="mt-2 text-sm text-zinc-600">
          This clears all draft picks (My Team, Taken) and tribe assignments
          stored in this browser. It cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

function CastFiltersBar({
  statusFilter,
  onStatusFilterChange,
  statusMatchCount,
  tribeFilter,
  onTribeFilterChange,
  tribeMatchCount,
  tribes,
  totalCount,
  cardControlMode,
  onCardControlMode,
  onRequestReset,
}: {
  statusFilter: DraftStatusFilter;
  onStatusFilterChange: (value: DraftStatusFilter) => void;
  statusMatchCount: number;
  tribeFilter: TribeFilter;
  onTribeFilterChange: (value: TribeFilter) => void;
  tribeMatchCount: number;
  tribes: Tribe[];
  totalCount: number;
  cardControlMode: CardControlMode;
  onCardControlMode: (mode: CardControlMode) => void;
  onRequestReset: () => void;
}) {
  return (
    <div className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium text-zinc-700">Mode:</span>
            <div className="flex gap-1.5" role="group" aria-label="Assignment mode">
              <button
                type="button"
                aria-pressed={cardControlMode === "draft"}
                className={modeButtonClass(cardControlMode === "draft")}
                onClick={() => onCardControlMode("draft")}
              >
                Draft
              </button>
              <button
                type="button"
                aria-pressed={cardControlMode === "tribe"}
                className={modeButtonClass(cardControlMode === "tribe")}
                onClick={() => onCardControlMode("tribe")}
              >
                Assign Tribes
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={onRequestReset}
            className="ml-auto text-sm font-medium text-zinc-500 hover:text-red-600"
          >
            Reset
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <label className="flex flex-col gap-1 text-sm">
            <FilterLabel
              label="Draft status"
              count={statusMatchCount}
              totalCount={totalCount}
            />
            <select
              value={statusFilter}
              onChange={(e) =>
                onStatusFilterChange(e.target.value as DraftStatusFilter)
              }
              className="min-w-[10rem] rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm"
            >
              <option value="available">Available</option>
              <option value="my-team">My Team</option>
              <option value="taken">Taken</option>
              <option value="all">All</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <FilterLabel
              label="Tribe"
              count={tribeMatchCount}
              totalCount={totalCount}
            />
            <select
              value={tribeFilter}
              onChange={(e) =>
                onTribeFilterChange(e.target.value as TribeFilter)
              }
              className="min-w-[10rem] rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm"
            >
              <option value="all">All tribes</option>
              {tribes.map((tribe) => (
                <option key={tribe.id} value={tribe.id}>
                  {tribe.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}

function Lightbox({
  player,
  cardControlMode,
  draftStatus,
  onDraftStatusChange,
  playerTribeId,
  onTribeChange,
  tribes,
  onClose,
}: {
  player: Player;
  cardControlMode: CardControlMode;
  draftStatus: DraftStatus;
  onDraftStatusChange: (status: DraftStatus) => void;
  playerTribeId: TribeId | null;
  onTribeChange: (tribeId: TribeId | null) => void;
  tribes: Tribe[];
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative flex max-h-[min(92dvh,92vh)] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl sm:max-w-2xl md:max-h-[min(88dvh,88vh)] md:max-w-4xl md:flex-row">
        <div className="relative aspect-[8/5] w-full shrink-0 bg-zinc-200 md:w-[min(36vw,18rem)]">
          <Image
            src={`/photos/${player.photo}`}
            alt={player.name}
            fill
            className="object-cover object-top"
            sizes="(max-width: 768px) 100vw, 352px"
            priority
          />
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-zinc-100 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2
                  id="lightbox-title"
                  className="text-lg font-semibold leading-tight text-zinc-900"
                >
                  {player.name}
                  <span className="ml-2 font-normal text-zinc-500">
                    {player.age}
                  </span>
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  {player.occupation}
                  <span className="text-zinc-400"> · </span>
                  {player.place}
                </p>
                <WordPills words={player.words} />
                <div className="mt-3">
                  {cardControlMode === "draft" ? (
                    <DraftStatusControls
                      value={draftStatus}
                      onChange={onDraftStatusChange}
                    />
                  ) : (
                    <TribeControls
                      tribes={tribes}
                      value={playerTribeId}
                      onChange={onTribeChange}
                    />
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
              >
                Close
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <p className="text-sm leading-relaxed text-zinc-700">{player.bio}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CastGrid({ cast }: { cast: Player[] }) {
  const [selected, setSelected] = useState<Player | null>(null);
  const [statusByName, setStatusByName] = useState<
    Record<string, DraftStatus>
  >({});
  const [tribeByName, setTribeByName] = useState<
    Partial<Record<string, TribeId>>
  >({});
  const [myTeamOrder, setMyTeamOrder] = useState<string[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [statusFilter, setStatusFilter] =
    useState<DraftStatusFilter>("available");
  const [tribeFilter, setTribeFilter] = useState<TribeFilter>("all");
  const [cardControlMode, setCardControlMode] =
    useState<CardControlMode>("draft");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  useEffect(() => {
    const status = readDraftStatusMap();
    setStatusByName(status);
    setMyTeamOrder(reconcileMyTeamOrder(status, readMyTeamOrder()));
    setTribeByName(readTribeAssignmentMap());
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(
      DRAFT_STATUS_STORAGE_KEY,
      JSON.stringify(statusByName),
    );
    localStorage.setItem(
      MY_TEAM_ORDER_STORAGE_KEY,
      JSON.stringify(myTeamOrder),
    );
    localStorage.setItem(
      TRIBE_ASSIGNMENT_STORAGE_KEY,
      JSON.stringify(tribeByName),
    );
  }, [statusByName, myTeamOrder, tribeByName, storageReady]);

  const setPlayerStatus = useCallback((name: string, status: DraftStatus) => {
    setStatusByName((prev) => {
      if (status === "available") {
        const next = { ...prev };
        delete next[name];
        return next;
      }
      return { ...prev, [name]: status };
    });

    setMyTeamOrder((prev) => {
      if (status === "my-team") {
        if (prev.includes(name)) return prev;
        return [...prev, name];
      }
      return prev.filter((n) => n !== name);
    });
  }, []);

  const setPlayerTribe = useCallback(
    (name: string, tribeId: TribeId | null) => {
      setTribeByName((prev) => {
        if (tribeId === null) {
          const next = { ...prev };
          delete next[name];
          return next;
        }
        return { ...prev, [name]: tribeId };
      });
    },
    [],
  );

  const getPlayerStatus = useCallback(
    (name: string) => resolveDraftStatus(statusByName, name),
    [statusByName],
  );

  const getPlayerTribe = useCallback(
    (name: string) => resolvePlayerTribe(tribeByName, name),
    [tribeByName],
  );

  const matchesStatusFilter = useCallback(
    (player: Player) => {
      if (statusFilter === "all") return true;
      return getPlayerStatus(player.name) === statusFilter;
    },
    [statusFilter, getPlayerStatus],
  );

  const matchesTribeFilter = useCallback(
    (player: Player) => {
      if (tribeFilter === "all") return true;
      return getPlayerTribe(player.name) === tribeFilter;
    },
    [tribeFilter, getPlayerTribe],
  );

  const statusMatchCount = useMemo(
    () => cast.filter(matchesStatusFilter).length,
    [cast, matchesStatusFilter],
  );

  const tribeMatchCount = useMemo(
    () => cast.filter(matchesTribeFilter).length,
    [cast, matchesTribeFilter],
  );

  const filteredCast = useMemo(() => {
    let list = cast.filter(
      (player) => matchesStatusFilter(player) && matchesTribeFilter(player),
    );
    if (statusFilter === "my-team") {
      list = sortCastByMyTeamPickOrder(list, myTeamOrder);
    }
    return list;
  }, [
    cast,
    statusFilter,
    matchesStatusFilter,
    matchesTribeFilter,
    myTeamOrder,
  ]);

  const close = useCallback(() => setSelected(null), []);

  const confirmReset = useCallback(() => {
    clearPersistedCastData();
    setStatusByName({});
    setTribeByName({});
    setMyTeamOrder([]);
    setResetDialogOpen(false);
  }, []);

  return (
    <>
      <CastFiltersBar
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusMatchCount={statusMatchCount}
        tribeFilter={tribeFilter}
        onTribeFilterChange={setTribeFilter}
        tribeMatchCount={tribeMatchCount}
        tribes={TRIBES}
        totalCount={cast.length}
        cardControlMode={cardControlMode}
        onCardControlMode={setCardControlMode}
        onRequestReset={() => setResetDialogOpen(true)}
      />
      {resetDialogOpen ? (
        <ResetConfirmDialog
          onConfirm={confirmReset}
          onCancel={() => setResetDialogOpen(false)}
        />
      ) : null}
      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCast.length === 0 ? (
          <p className="col-span-full py-12 text-center text-sm text-zinc-500">
            No castaways match this filter.
          </p>
        ) : null}
        {filteredCast.map((player) => {
          const status = getPlayerStatus(player.name);
          const tribeId = getPlayerTribe(player.name);
          const pickIndex =
            statusFilter === "my-team"
              ? myTeamOrder.indexOf(player.name)
              : -1;
          const pickNumber = pickIndex >= 0 ? pickIndex + 1 : null;
          const assignedTribe = tribeId ? getTribeById(tribeId) : undefined;
          return (
            <article
              key={player.name}
              style={
                assignedTribe
                  ? { backgroundColor: assignedTribe.color }
                  : undefined
              }
              className={`relative overflow-hidden rounded-xl border border-zinc-200 shadow-sm transition-shadow hover:shadow-md ${
                assignedTribe ? "" : "bg-white"
              }`}
            >
              {pickNumber !== null ? (
                <span
                  className="pointer-events-none absolute left-0 top-0 z-10 flex h-8 min-w-8 items-center justify-center rounded-br-lg bg-emerald-600 px-1.5 text-sm font-semibold tabular-nums text-white shadow-sm"
                  aria-label={`Pick ${pickNumber}`}
                >
                  {pickNumber}
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => setSelected(player)}
                className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400"
              >
                <div className="flex gap-3 p-4">
                  <Image
                    src={`/headshots/${player.headshot}`}
                    alt=""
                    width={72}
                    height={72}
                    className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-lg border border-zinc-200 bg-zinc-100 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold leading-tight text-zinc-900">
                      {player.name}
                      <span className="ml-2 font-normal text-zinc-500">
                        {player.age}
                      </span>
                    </h2>
                    <p className="mt-1 text-sm text-zinc-600">
                      {player.occupation}
                      <span className="text-zinc-400"> · </span>
                      {gridPlaceStates(player.place)}
                    </p>
                    <WordPills words={player.words} />
                  </div>
                </div>
              </button>
              <div className="border-t border-zinc-900/10 px-4 py-3">
                {cardControlMode === "draft" ? (
                  <DraftStatusControls
                    value={status}
                    onChange={(next) => setPlayerStatus(player.name, next)}
                    stopCardClick
                  />
                ) : (
                  <TribeControls
                    tribes={TRIBES}
                    value={tribeId}
                    onChange={(next) => setPlayerTribe(player.name, next)}
                    stopCardClick
                  />
                )}
              </div>
            </article>
          );
        })}
      </main>
      {selected ? (
        <Lightbox
          player={selected}
          cardControlMode={cardControlMode}
          draftStatus={getPlayerStatus(selected.name)}
          onDraftStatusChange={(next) =>
            setPlayerStatus(selected.name, next)
          }
          playerTribeId={getPlayerTribe(selected.name)}
          onTribeChange={(next) => setPlayerTribe(selected.name, next)}
          tribes={TRIBES}
          onClose={close}
        />
      ) : null}
    </>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  type DraftStatus,
  DRAFT_STATUS_STORAGE_KEY,
  MY_TEAM_ORDER_STORAGE_KEY,
  TAKEN_ORDER_STORAGE_KEY,
  readDraftStatusMap,
  readMyTeamOrder,
  readTakenOrder,
  reconcileMyTeamOrder,
  reconcileTakenOrder,
} from "@/app/lib/draft-status";
import { normalizeLeagueSlug } from "@/app/lib/league-slug";
import type { LeagueDraftPayload } from "@/app/lib/league-draft";
import {
  readTribeAssignmentMap,
  TRIBE_ASSIGNMENT_STORAGE_KEY,
  type TribeId,
} from "@/app/lib/tribe-assignment";

const DRAFT_SAVE_MS = 500;
/** Refresh interval while this tab is visible (no background / no-server polling) */
const REMOTE_POLL_MS = 1_000;

async function fetchTribeAssignments(): Promise<
  Partial<Record<string, TribeId>>
> {
  const res = await fetch("/api/tribes/assignments", { cache: "no-store" });
  if (!res.ok) throw new Error("tribe fetch failed");
  const data = (await res.json()) as { assignments?: Partial<Record<string, TribeId>> };
  return data.assignments ?? {};
}

async function saveTribeAssignments(
  assignments: Partial<Record<string, TribeId>>,
): Promise<void> {
  const res = await fetch("/api/tribes/assignments", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assignments }),
  });
  if (!res.ok) throw new Error("tribe save failed");
}

async function fetchLeagueDraft(
  leagueSlug: string,
): Promise<LeagueDraftPayload> {
  const res = await fetch(`/api/leagues/${encodeURIComponent(leagueSlug)}/draft`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("league fetch failed");
  return (await res.json()) as LeagueDraftPayload;
}

async function saveLeagueDraft(
  leagueSlug: string,
  draft: LeagueDraftPayload,
): Promise<void> {
  const res = await fetch(`/api/leagues/${encodeURIComponent(leagueSlug)}/draft`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });
  if (!res.ok) throw new Error("league save failed");
}

function applyLeagueDraft(draft: LeagueDraftPayload) {
  const statusByName = draft.statusByName ?? {};
  return {
    statusByName,
    myTeamOrder: reconcileMyTeamOrder(statusByName, draft.myTeamOrder ?? []),
    takenOrder: reconcileTakenOrder(statusByName, draft.takenOrder ?? []),
  };
}

/** Poll only while the document is visible; stops when tab is hidden or unmounted. */
function usePollWhileTabVisible(pull: () => void | Promise<void>, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    let intervalId: number | undefined;

    const tick = () => {
      if (document.visibilityState !== "visible") return;
      void pull();
    };

    const start = () => {
      if (intervalId !== undefined) return;
      tick();
      intervalId = window.setInterval(tick, REMOTE_POLL_MS);
    };

    const stop = () => {
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
        intervalId = undefined;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [pull, enabled]);
}

export function useSyncedCastState() {
  const searchParams = useSearchParams();
  const leagueSlug = normalizeLeagueSlug(searchParams.get("league"));

  const [statusByName, setStatusByName] = useState<
    Record<string, DraftStatus>
  >({});
  const [tribeByName, setTribeByName] = useState<
    Partial<Record<string, TribeId>>
  >({});
  const [myTeamOrder, setMyTeamOrder] = useState<string[]>([]);
  const [takenOrder, setTakenOrder] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const draftDirtyRef = useRef(false);
  const tribeDirtyRef = useRef(false);
  const skipNextDraftSaveRef = useRef(false);
  const skipNextTribeSaveRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setSyncError(null);

      try {
        const remoteTribes = await fetchTribeAssignments();
        if (!cancelled) {
          skipNextTribeSaveRef.current = true;
          setTribeByName(remoteTribes);
        }
      } catch {
        if (!cancelled) {
          setTribeByName(readTribeAssignmentMap());
          setSyncError("Could not load shared tribe assignments.");
        }
      }

      if (leagueSlug) {
        try {
          const draft = await fetchLeagueDraft(leagueSlug);
          if (!cancelled) {
            skipNextDraftSaveRef.current = true;
            const applied = applyLeagueDraft(draft);
            setStatusByName(applied.statusByName);
            setMyTeamOrder(applied.myTeamOrder);
            setTakenOrder(applied.takenOrder);
          }
        } catch {
          if (!cancelled) {
            setSyncError("Could not load league draft for this URL.");
          }
        }
      } else if (!cancelled) {
        const status = readDraftStatusMap();
        setStatusByName(status);
        setMyTeamOrder(reconcileMyTeamOrder(status, readMyTeamOrder()));
        setTakenOrder(reconcileTakenOrder(status, readTakenOrder()));
      }

      if (!cancelled) setReady(true);
    }

    setReady(false);
    void load();

    return () => {
      cancelled = true;
    };
  }, [leagueSlug]);

  useEffect(() => {
    if (!ready || leagueSlug) return;
    localStorage.setItem(
      DRAFT_STATUS_STORAGE_KEY,
      JSON.stringify(statusByName),
    );
    localStorage.setItem(
      MY_TEAM_ORDER_STORAGE_KEY,
      JSON.stringify(myTeamOrder),
    );
    localStorage.setItem(TAKEN_ORDER_STORAGE_KEY, JSON.stringify(takenOrder));
  }, [statusByName, myTeamOrder, takenOrder, ready, leagueSlug]);

  useEffect(() => {
    if (!ready) return;
    if (skipNextDraftSaveRef.current) {
      skipNextDraftSaveRef.current = false;
      return;
    }
    if (!leagueSlug) return;

    draftDirtyRef.current = true;
    const timer = window.setTimeout(() => {
      void saveLeagueDraft(leagueSlug, {
        statusByName,
        myTeamOrder,
        takenOrder,
      })
        .then(() => {
          draftDirtyRef.current = false;
        })
        .catch(() => {
          setSyncError("Could not save league draft.");
        });
    }, DRAFT_SAVE_MS);

    return () => window.clearTimeout(timer);
  }, [statusByName, myTeamOrder, takenOrder, leagueSlug, ready]);

  useEffect(() => {
    if (!ready) return;
    if (skipNextTribeSaveRef.current) {
      skipNextTribeSaveRef.current = false;
      return;
    }

    tribeDirtyRef.current = true;
    const timer = window.setTimeout(() => {
      void saveTribeAssignments(tribeByName)
        .then(() => {
          tribeDirtyRef.current = false;
        })
        .catch(() => {
          setSyncError("Could not save tribe assignments.");
        });
    }, DRAFT_SAVE_MS);

    return () => window.clearTimeout(timer);
  }, [tribeByName, ready]);

  const pullLeagueDraft = useCallback(async () => {
    if (!leagueSlug || draftDirtyRef.current) return;
    try {
      const draft = await fetchLeagueDraft(leagueSlug);
      skipNextDraftSaveRef.current = true;
      const applied = applyLeagueDraft(draft);
      setStatusByName(applied.statusByName);
      setMyTeamOrder(applied.myTeamOrder);
      setTakenOrder(applied.takenOrder);
    } catch {
      /* ignore transient poll errors */
    }
  }, [leagueSlug]);

  const pullTribeAssignments = useCallback(async () => {
    if (tribeDirtyRef.current) return;
    try {
      const assignments = await fetchTribeAssignments();
      skipNextTribeSaveRef.current = true;
      setTribeByName(assignments);
    } catch {
      /* ignore transient poll errors */
    }
  }, []);

  usePollWhileTabVisible(pullLeagueDraft, ready && Boolean(leagueSlug));
  usePollWhileTabVisible(pullTribeAssignments, ready);

  const resetAll = useCallback(async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(DRAFT_STATUS_STORAGE_KEY);
      localStorage.removeItem(MY_TEAM_ORDER_STORAGE_KEY);
      localStorage.removeItem(TAKEN_ORDER_STORAGE_KEY);
      localStorage.removeItem(TRIBE_ASSIGNMENT_STORAGE_KEY);
    }

    skipNextDraftSaveRef.current = true;
    skipNextTribeSaveRef.current = true;
    setStatusByName({});
    setMyTeamOrder([]);
    setTakenOrder([]);
    setTribeByName({});

    const tasks: Promise<void>[] = [
      saveTribeAssignments({}).catch(() => {
        setSyncError("Could not reset tribe assignments on server.");
      }),
    ];

    if (leagueSlug) {
      tasks.push(
        saveLeagueDraft(leagueSlug, {
          statusByName: {},
          myTeamOrder: [],
          takenOrder: [],
        }).catch(() => {
          setSyncError("Could not reset league draft on server.");
        }),
      );
    }

    await Promise.all(tasks);
  }, [leagueSlug]);

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

    setTakenOrder((prev) => {
      if (status === "taken") {
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

  return {
    leagueSlug,
    ready,
    syncError,
    statusByName,
    tribeByName,
    myTeamOrder,
    takenOrder,
    setPlayerStatus,
    setPlayerTribe,
    resetAll,
  };
}

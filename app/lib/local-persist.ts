import {
  DRAFT_STATUS_STORAGE_KEY,
  MY_TEAM_ORDER_STORAGE_KEY,
  TAKEN_ORDER_STORAGE_KEY,
} from "@/app/lib/draft-status";
import { TRIBE_ASSIGNMENT_STORAGE_KEY } from "@/app/lib/tribe-assignment";

export function clearPersistedCastData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DRAFT_STATUS_STORAGE_KEY);
  localStorage.removeItem(MY_TEAM_ORDER_STORAGE_KEY);
  localStorage.removeItem(TAKEN_ORDER_STORAGE_KEY);
  localStorage.removeItem(TRIBE_ASSIGNMENT_STORAGE_KEY);
}

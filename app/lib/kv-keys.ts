export const SEASON_ID = "s51";

export function tribeAssignmentsKey(): string {
  return `fs:${SEASON_ID}:tribes`;
}

export function leagueDraftKey(leagueSlug: string): string {
  return `fs:${SEASON_ID}:league:${leagueSlug}`;
}

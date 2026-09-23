const LEAGUE_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?$/;

export function normalizeLeagueSlug(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const slug = raw.trim().toLowerCase();
  if (!slug || slug.length > 48) return null;
  if (!LEAGUE_SLUG_PATTERN.test(slug)) return null;
  return slug;
}

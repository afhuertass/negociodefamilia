/**
 * Normalize a `participante` query-param value into a participant name, or null
 * if absent/empty. Accepts the string | string[] | undefined shapes that
 * Next.js `searchParams` can produce. Matching against the DB is exact (after
 * trim) — the NameSelector dropdown prevents typos, so no fuzzy logic here.
 */
export function normalizeParticipantName(
  raw: string | string[] | undefined
): string | null {
  if (Array.isArray(raw)) raw = raw[0];
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}
export const BADGE_TITLES = ["смотрящий", "АДминЬ"] as const;
export type PublicResponsibility = { kind: string; title: string; names: string[] };
export function tenure(startedOn: string) {
  if (!startedOn) return "Не указан";
  const start = new Date(startedOn + "T00:00:00");
  if (!Number.isFinite(start.getTime())) return "Не указан";
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();
  if (now.getDate() < start.getDate()) months--;
  months = Math.max(0, months);
  return `${Math.floor(months / 12)} г. ${months % 12} мес.`;
}
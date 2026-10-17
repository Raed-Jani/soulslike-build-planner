import type { StatusType } from "../weapon";
export const STAT_FIELDS = ["str", "dex", "int", "fai", "arc"] as const;
export type StatField = (typeof STAT_FIELDS)[number];
export type StatText = Record<StatField, string>;

export const STAT_LABELS: Record<StatField, string> = {
  str: "Strength", dex: "Dexterity", int: "Intelligence", fai: "Faith", arc: "Arcane",
};
export const STAT_SHORT: Record<StatField, string> = {
  str: "Str", dex: "Dex", int: "Int", fai: "Fai", arc: "Arc",
};

// text -> a valid stat (1 to 99); empty or invalid text counts as 1
export function parseStat(text: string): number {
  const n = Math.floor(Number(text));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(99, n);
}
export const STATUS_LABELS: Record<StatusType, string> = {
  poison: "Poison",
  scarletRot: "Scarlet rot",
  bleed: "Blood loss",
  frost: "Frostbite",
  sleep: "Sleep",
  madness: "Madness",
  deathBlight: "Death blight",
};
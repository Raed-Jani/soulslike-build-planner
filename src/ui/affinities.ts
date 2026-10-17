import type { IconName } from "./icons";

// affinityId numbers come from the game data; affinities.test.ts checks them against it
export const AFFINITIES = [
  { key: "standard", label: "Standard", id: 0, icon: "physical" },
  { key: "heavy", label: "Heavy", id: 1, icon: "heavy" },
  { key: "keen", label: "Keen", id: 2, icon: "keen" },
  { key: "quality", label: "Quality", id: 3, icon: "quality" },
  { key: "magic", label: "Magic", id: 8, icon: "magic" },
  { key: "fire", label: "Fire", id: 4, icon: "fire" },
  { key: "flameArt", label: "Flame Art", id: 5, icon: "fire" },
  { key: "lightning", label: "Lightning", id: 6, icon: "lightning" },
  { key: "sacred", label: "Sacred", id: 7, icon: "holy" },
  { key: "cold", label: "Cold", id: 9, icon: "cold" },
  { key: "poison", label: "Poison", id: 10, icon: "poison" },
  { key: "blood", label: "Blood", id: 11, icon: "blood" },
  { key: "occult", label: "Occult", id: 12, icon: "occult" },
  { key: "unique", label: "Unique", id: -1, icon: "unique" },
] as const satisfies readonly { key: string; label: string; id: number; icon: IconName }[];

export type AffinityKey = (typeof AFFINITIES)[number]["key"];

const KEY_BY_ID = new Map<number, AffinityKey>(AFFINITIES.map((a) => [a.id, a.key]));

export function affinityKeyOf(id: number): AffinityKey | undefined {
  return KEY_BY_ID.get(id);
}
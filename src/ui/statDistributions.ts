import type { Attributes } from "../attributes";
import type { Weapon } from "../weapon";
import { STAT_FIELDS, parseStat, type StatField, type StatText } from "./stats";

export type ConfigurationId = "a" | "b";
export interface StatConfiguration {
  id: ConfigurationId;
  statText: StatText;
  level: number;
  twoHanding: boolean;
  affinityId?: number;
}
export interface WeaponVariant { affinityId: number; label: string; weapon: Weapon }
export interface DistributionPair {
  a: StatConfiguration;
  b: StatConfiguration;
}

export function normalizeStatText(text: StatText): StatText {
  return Object.fromEntries(STAT_FIELDS.map((stat) => [stat, String(parseStat(text[stat]))])) as StatText;
}

export function distributionAttributes(text: StatText): Attributes {
  return {
    vig: 20, mnd: 10, end: 20,
    str: parseStat(text.str), dex: parseStat(text.dex), int: parseStat(text.int),
    fai: parseStat(text.fai), arc: parseStat(text.arc),
  };
}

export function createDistributionPair(text: StatText, level = 0, twoHanding = false, affinityId?: number): DistributionPair {
  const normalized = normalizeStatText(text);
  const affinity = affinityId === undefined ? {} : { affinityId };
  return { a: { id: "a", statText: { ...normalized }, level, twoHanding, ...affinity }, b: { id: "b", statText: { ...normalized }, level, twoHanding, ...affinity } };
}

export function updateDistribution(pair: DistributionPair, id: ConfigurationId, stat: StatField, text: string): DistributionPair {
  return { ...pair, [id]: { ...pair[id], statText: { ...pair[id].statText, [stat]: text } } };
}

/** Copy once; keep the two editors independently owned. */
export function copyAToB(pair: DistributionPair): DistributionPair {
  return { ...pair, b: { ...pair.a, id: "b", statText: { ...normalizeStatText(pair.a.statText) } } };
}

export function updateConfigurationSettings(pair: DistributionPair, id: ConfigurationId, settings: Partial<Pick<StatConfiguration, "level" | "twoHanding" | "affinityId">>): DistributionPair {
  return { ...pair, [id]: { ...pair[id], ...settings } };
}

export function changeConfigurationAffinity(pair: DistributionPair, id: ConfigurationId, variant: WeaponVariant): DistributionPair {
  return updateConfigurationSettings(pair, id, { affinityId: variant.affinityId, level: Math.min(pair[id].level, variant.weapon.attack.length - 1) });
}

/** Top-bar edits change the same attribute in every A; B remains the saved alternative. */
export function updateComparisonBaselines(pairs: Record<number, DistributionPair>, stat: StatField, text: string): Record<number, DistributionPair> {
  return Object.fromEntries(Object.entries(pairs).map(([index, pair]) => [index, updateDistribution(pair, "a", stat, text)]));
}

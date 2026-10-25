import type { RawWeapon, RegulationData } from "../regulationData";
import { STAT_FIELDS, type StatText } from "./stats";
import type { DistributionPair, StatConfiguration } from "./statDistributions";

export const SHARE_VERSION = 4;
export const DATA_VERSION = "1.17";
export const MAX_SHARE_WEAPONS = 100;
const MAX_HASH_LENGTH = 32000;

export interface ComparisonState {
  statText: StatText;
  picked: number[];
  levels: Record<number, number>;
  twoHandings: Record<number, boolean>;
  distributions?: Record<number, DistributionPair>;
}

// No numeric game IDs are shipped in this dataset. Preserve the exact base name
// and affinity ID; do not slugify, use display names, or persist array positions.
export function stableWeaponId(weapon: Pick<RawWeapon, "weaponName" | "affinityId">): string {
  return `${weapon.affinityId}:${weapon.weaponName}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalid(): never {
  throw new Error("This comparison link is invalid. Your current comparison was kept.");
}

function statValues(text: StatText): number[] {
  const values = STAT_FIELDS.map((stat) => Number(text[stat]));
  if (values.some((value) => !Number.isInteger(value) || value < 1 || value > 99)) invalid();
  return values;
}

function decodeStats(value: unknown): StatText {
  if (!Array.isArray(value) || value.length !== STAT_FIELDS.length ||
      value.some((stat) => typeof stat !== "number" || !Number.isInteger(stat) || stat < 1 || stat > 99)) invalid();
  return Object.fromEntries(STAT_FIELDS.map((stat, index) => [stat, String(value[index])])) as StatText;
}

function decodeConfigurations(value: unknown, level: number, twoHanding: boolean, version: number): DistributionPair {
  if (!Array.isArray(value) || value.length !== 2) invalid();
  const configs: Partial<DistributionPair> = {};
  for (const config of value) {
    if (!isRecord(config) || (config.id !== "a" && config.id !== "b") || configs[config.id]) invalid();
    const ownLevel = version >= 3 ? config.level : level;
    const ownHanding = version >= 3 ? config.twoHanding : twoHanding;
    if (typeof ownLevel !== "number" || !Number.isInteger(ownLevel) || ownLevel < 0 || ownLevel > 25 || typeof ownHanding !== "boolean") invalid();
    const affinity = version >= 4 && config.affinityId !== undefined ? config.affinityId : undefined;
    if (affinity !== undefined && (typeof affinity !== "number" || !Number.isInteger(affinity))) invalid();
    configs[config.id] = { id: config.id, statText: decodeStats(config.stats), level: ownLevel, twoHanding: ownHanding, ...(affinity === undefined ? {} : { affinityId: affinity as number }) };
  }
  if (!configs.a || !configs.b) invalid();
  return { a: configs.a, b: configs.b };
}

function validateVariants(pair: DistributionPair, parent: RawWeapon, data: RegulationData) {
  for (const config of [pair.a, pair.b]) {
    const raw = data.weapons.find((weapon) => weapon.weaponName === parent.weaponName && weapon.affinityId === (config.affinityId ?? parent.affinityId));
    if (!raw || config.level >= data.reinforceTypes[raw.reinforceTypeId].length) invalid();
  }
}

export function encodeComparison(state: ComparisonState, data: RegulationData): string {
  if (state.picked.length > MAX_SHARE_WEAPONS) {
    throw new Error(`Share links support up to ${MAX_SHARE_WEAPONS} weapons. Remove some weapons and try again.`);
  }
  const stats = statValues(state.statText);
  const weapons = state.picked.map((index) => {
    const weapon = data.weapons[index];
    if (!weapon) invalid();
    const level = state.levels[index] ?? 0;
    if (!Number.isInteger(level) || level < 0 || level >= data.reinforceTypes[weapon.reinforceTypeId].length) invalid();
    const pair = state.distributions?.[index];
    const configurations = pair ? ([pair.a, pair.b] as StatConfiguration[]).map((config) => ({ id: config.id, stats: statValues(config.statText), level: config.level, twoHanding: config.twoHanding, affinityId: config.affinityId })) : undefined;
    if (configurations) {
      decodeConfigurations(configurations, level, false, SHARE_VERSION);
      validateVariants(pair!, weapon, data);
    }
    return { id: stableWeaponId(weapon), level, twoHanding: state.twoHandings[index] ?? false, configurations };
  });
  const hash = `#build=${encodeURIComponent(JSON.stringify({ v: SHARE_VERSION, patch: DATA_VERSION, stats, weapons }))}`;
  if (hash.length > MAX_HASH_LENGTH) throw new Error("This comparison is too large to share. Remove some weapons and try again.");
  return hash;
}

export function decodeComparison(hash: string, data: RegulationData): { state: ComparisonState; warnings: string[] } | null {
  if (!hash.startsWith("#build=")) return null;
  if (hash.length > MAX_HASH_LENGTH) invalid();
  let payload: unknown;
  try {
    payload = JSON.parse(decodeURIComponent(hash.slice(7)));
  } catch {
    invalid();
  }
  if (!isRecord(payload)) invalid();
  if (payload.v !== 1 && payload.v !== 2 && payload.v !== 3 && payload.v !== SHARE_VERSION) {
    throw new Error("This comparison link uses an unsupported format version. Your current comparison was kept.");
  }
  if (typeof payload.patch !== "string" || payload.patch.length > 32) invalid();
  const { stats, weapons } = payload;
  const statText = decodeStats(stats);
  if (!Array.isArray(weapons) || weapons.length > MAX_SHARE_WEAPONS) invalid();

  const byId = new Map<string, number>();
  data.weapons.forEach((weapon, index) => {
    const id = stableWeaponId(weapon);
    if (byId.has(id)) throw new Error("Weapon identifiers are ambiguous in this dataset. The comparison could not be loaded.");
    byId.set(id, index);
  });
  const state: ComparisonState = {
    statText,
    picked: [], levels: {}, twoHandings: {},
  };
  const warnings: string[] = [];
  if (payload.patch !== DATA_VERSION) {
    warnings.push(`This link was created with patch ${payload.patch}. Results now use patch ${DATA_VERSION} and may differ.`);
  }
  const seen = new Set<string>();
  let unavailable = 0;
  for (const entry of weapons) {
    if (!isRecord(entry) || typeof entry.id !== "string" || entry.id.length > 300 ||
        typeof entry.level !== "number" || !Number.isInteger(entry.level) || entry.level < 0 || entry.level > 25 ||
        typeof entry.twoHanding !== "boolean" || seen.has(entry.id)) invalid();
    seen.add(entry.id);
    if (payload.v === 1 && entry.configurations !== undefined) invalid();
    const pair = entry.configurations === undefined ? undefined : decodeConfigurations(entry.configurations, entry.level, entry.twoHanding, payload.v as number);
    const index = byId.get(entry.id);
    if (index === undefined) { unavailable++; continue; }
    const weapon = data.weapons[index];
    if (entry.level >= data.reinforceTypes[weapon.reinforceTypeId].length) invalid();
    if (pair) validateVariants(pair, weapon, data);
    state.picked.push(index);
    state.levels[index] = entry.level;
    state.twoHandings[index] = entry.twoHanding;
    if (pair) {
      state.distributions ??= {};
      state.distributions[index] = pair;
    }
  }
  if (unavailable) warnings.push(`${unavailable} weapon(s) are unavailable in this dataset and were skipped.`);
  return { state, warnings };
}

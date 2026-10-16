import { allDamageTypes, type DamageType, type Weapon } from "./weapon";
import { allAttributes, type Attribute, type Attributes } from "./attributes";

const INEFFECTIVE_PENALTY = 0.4;

// weaponType numbers read from the game data: light bows 50, bows 51, greatbows 53,
// ballistae 56. These can only be used two-handed.
export const ALWAYS_TWO_HANDED = [50, 51, 53, 56];

export type AttackResult = Partial<Record<DamageType, number>>;

export interface DamageDetail {
  base: number; // the weapon's base damage of this type at this level
  bonus: number; // total - base (negative when the requirement penalty applies)
  total: number; // unrounded
  penalized: boolean; // true when a requirement penalty replaced the scaling bonus
}

export interface ARDetail {
  damage: Partial<Record<DamageType, DamageDetail>>;
  unmet: Attribute[]; // stats below the weapon's requirement (after two-handing)
}

// two-handing gives +50% Strength, rounded down
export function adjustForTwoHanding(
  weapon: Weapon,
  attributes: Attributes,
  twoHanding: boolean
): Attributes {
  let bonus = twoHanding;
  if (weapon.paired) bonus = false; // paired weapons never get the bonus
  if (weapon.weaponType !== undefined && ALWAYS_TWO_HANDED.includes(weapon.weaponType)) {
    bonus = true;
  }
  if (!bonus) return attributes;
  return { ...attributes, str: Math.floor(attributes.str * 1.5) };
}

export function calculateARDetail(
  weapon: Weapon,
  attributes: Attributes,
  upgradeLevel: number,
  twoHanding = false
): ARDetail {
  const stats = adjustForTwoHanding(weapon, attributes, twoHanding);

  const unmet = allAttributes.filter(
    (stat) => stats[stat] < (weapon.requirements[stat] ?? 0)
  );

  const damage: ARDetail["damage"] = {};

  for (const type of allDamageTypes) {
    const base = weapon.attack[upgradeLevel][type] ?? 0;
    if (base === 0) continue;

    const correct = weapon.attackElementCorrect[type] ?? {};
    const scalingStats = allAttributes.filter((stat) => correct[stat]);

    const penalized = scalingStats.some((stat) => unmet.includes(stat));
    let multiplier = 1;
    if (penalized) {
      // a stat this damage type scales with is too low: penalty instead of bonus
      multiplier = 1 - INEFFECTIVE_PENALTY;
    } else {
      for (const stat of scalingStats) {
        const levelScaling = weapon.attributeScaling[upgradeLevel][stat] ?? 0;
        const value = correct[stat]!;

        let scaling = levelScaling;
        if (value !== true) {
          // partial scaling: scale the weapon's growth by this fraction
          const baseScaling = weapon.attributeScaling[0][stat] ?? 0;
          scaling = baseScaling === 0 ? 0 : (value * levelScaling) / baseScaling;
        }

        multiplier += weapon.calcCorrectGraphs[type][stats[stat]] * scaling;
      }
    }

    const total = base * multiplier;
    damage[type] = { base, bonus: total - base, total, penalized };
  }

  return { damage, unmet };
}

export function calculateAR(
  weapon: Weapon,
  attributes: Attributes,
  upgradeLevel: number,
  twoHanding = false
): AttackResult {
  const { damage } = calculateARDetail(weapon, attributes, upgradeLevel, twoHanding);
  const result: AttackResult = {};
  for (const type of allDamageTypes) {
    const d = damage[type];
    if (d) result[type] = d.total;
  }
  return result;
}

export function totalAR(ar: AttackResult): number {
  let sum = 0;
  for (const type of allDamageTypes) {
    sum += ar[type] ?? 0;
  }
  return sum;
}

// What the game shows: each damage type rounded down, and a total that is the
// rounded-down sum of the unrounded values (so it can exceed the sum of the shown parts).
export function displayAR(ar: AttackResult) {
  const parts: Partial<Record<DamageType, number>> = {};
  for (const type of allDamageTypes) {
    if (ar[type] !== undefined) parts[type] = Math.floor(ar[type]!);
  }
  return { parts, total: Math.floor(totalAR(ar)) };
}

// Scaling letters. Tiers come from the game data (data.scalingTiers), listed from the
// highest threshold to the lowest, e.g. [[1.75, "S"], [1.4, "A"], ...]
export type ScalingTiers = [number, string][];

export function scalingGrade(value: number | undefined, tiers: ScalingTiers): string {
  if (!value) return "-";
  for (const [threshold, label] of tiers) {
    if (value >= threshold) return label;
  }
  return "-";
}

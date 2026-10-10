import { allDamageTypes, type DamageType, type Weapon } from "./weapon";
import { allAttributes, type Attributes } from "./attributes";

const INEFFECTIVE_PENALTY = 0.4;

export type AttackResult = Partial<Record<DamageType, number>>;

// two-handing gives +50% Strength, rounded down
export function adjustForTwoHanding(attributes: Attributes, twoHanding: boolean): Attributes {
  if (!twoHanding) return attributes;
  return { ...attributes, str: Math.floor(attributes.str * 1.5) };
}

export function calculateAR(
  weapon: Weapon,
  attributes: Attributes,
  upgradeLevel: number,
  twoHanding = false
): AttackResult {
  const stats = adjustForTwoHanding(attributes, twoHanding);

  //stats below minimun requirements
  const unmet = allAttributes.filter(
    (stat) => stats[stat] < (weapon.requirements[stat] ?? 0)
  );

  const result: AttackResult = {};

  for (const type of allDamageTypes) {
    const base = weapon.attack[upgradeLevel][type] ?? 0;
    if (base === 0) continue; // weapon has no damage of this type

    const scalingStats = weapon.attackElementCorrect[type] ?? [];

    let multiplier = 1;
    if (scalingStats.some((stat) => unmet.includes(stat))) {
        // a stat this damage type scales with is too low: penalty instead of bonus
      multiplier = 1 - INEFFECTIVE_PENALTY;
    } else {
    for (const stat of scalingStats) {
      const scaling = weapon.attributeScaling[upgradeLevel][stat] ?? 0;
      const curveValue = weapon.calcCorrectGraphs[type][stats[stat]];
      multiplier += curveValue * scaling;
    }
    }

    result[type] = base * multiplier;
  }

  return result;
}
// sum of all damage types
export function totalAR(ar: AttackResult): number {
  let sum = 0;
  for (const type of allDamageTypes) {
    sum += ar[type] ?? 0;
  }
  return sum;
}

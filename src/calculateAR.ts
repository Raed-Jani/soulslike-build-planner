import { allDamageTypes, type DamageType, type Weapon } from "./weapon";
import { allAttributes, type Attributes } from "./attributes";
const INEFFECTIVE_PENALTY = 0.4;

// weaponType numbers read from the game data: light bows 50, bows 51, greatbows 53,
// ballistae 56. These can only be used two-handed.
export const ALWAYS_TWO_HANDED = [50, 51, 53, 56];

export type AttackResult = Partial<Record<DamageType, number>>;

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

export function calculateAR(
  weapon: Weapon,
  attributes: Attributes,
  upgradeLevel: number,
  twoHanding = false
): AttackResult {
  const stats = adjustForTwoHanding(weapon, attributes, twoHanding);

  //stats below minimun requirements
  const unmet = allAttributes.filter(
    (stat) => stats[stat] < (weapon.requirements[stat] ?? 0)
  );

  const result: AttackResult = {};

  for (const type of allDamageTypes) {
    const base = weapon.attack[upgradeLevel][type] ?? 0;
    if (base === 0) continue; // weapon has no damage of this type

    const correct = weapon.attackElementCorrect[type] ?? {};
    const scalingStats = allAttributes.filter((stat) => correct[stat]);

    let multiplier = 1;
    if (scalingStats.some((stat) => unmet.includes(stat))) {
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

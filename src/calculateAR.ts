import { allDamageTypes, type DamageType, type Weapon } from "./weapon";
import type { Attributes } from "./attributes";

export function calculateAR(
  weapon: Weapon,
  attributes: Attributes,
  upgradeLevel: number
): Partial<Record<DamageType, number>> {
  const result: Partial<Record<DamageType, number>> = {};

  for (const type of allDamageTypes) {
    const base = weapon.attack[upgradeLevel][type] ?? 0;
    if (base === 0) continue; // weapon has no damage of this type

    const scalingStats = weapon.attackElementCorrect[type] ?? [];

    let multiplier = 1;
    for (const stat of scalingStats) {
      const scaling = weapon.attributeScaling[upgradeLevel][stat] ?? 0;
      const curveValue = weapon.calcCorrectGraphs[type][attributes[stat]];
      multiplier += curveValue * scaling;
    }

    result[type] = base * multiplier;
  }

  return result;
}
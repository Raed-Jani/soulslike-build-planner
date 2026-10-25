import { allAttributes, type Attributes } from "../attributes";
import { calculateARDetail, type ARDetail } from "../calculateAR";
import { allDamageTypes, allStatusTypes, type Weapon } from "../weapon";

export interface ComparisonValue { a: number; b: number; delta: number }
const difference = (a: number, b: number): ComparisonValue => ({ a, b, delta: b - a });
const shownTotal = (detail: ARDetail) => Math.floor(
  allDamageTypes.reduce((sum, type) => sum + (detail.damage[type]?.total ?? 0), 0)
);

/** Same weapon and affinity, with independently chosen configuration settings. */
export function compareDistributions(weapon: Weapon, a: Attributes, b: Attributes, level: number, twoHanding: boolean, settingsB = { level, twoHanding }, weaponB: Weapon = weapon) {
  const resultA = calculateARDetail(weapon, a, level, twoHanding);
  const resultB = calculateARDetail(weaponB, b, settingsB.level, settingsB.twoHanding);
  const spellTypes = allDamageTypes.filter((type) => resultA.spell[type] || resultB.spell[type]);
  const firstSpell = spellTypes[0];
  const uniformSpell = !!firstSpell && spellTypes.every((type) =>
    resultA.spell[type]?.scaling === resultA.spell[firstSpell]?.scaling &&
    resultB.spell[type]?.scaling === resultB.spell[firstSpell]?.scaling
  );
  return {
    total: difference(shownTotal(resultA), shownTotal(resultB)),
    uniformSpell,
    damage: allDamageTypes.filter((type) => resultA.damage[type] || resultB.damage[type]).map((type) => ({
      type, ...difference(Math.floor(resultA.damage[type]?.total ?? 0), Math.floor(resultB.damage[type]?.total ?? 0)),
    })),
    status: allStatusTypes.filter((type) => resultA.status[type] || resultB.status[type]).map((type) => ({
      type, ...difference(Math.floor(resultA.status[type]?.total ?? 0), Math.floor(resultB.status[type]?.total ?? 0)),
    })),
    spell: allDamageTypes.filter((type) => resultA.spell[type] || resultB.spell[type]).map((type) => ({
      type, ...difference(Math.floor(resultA.spell[type]?.scaling ?? 100), Math.floor(resultB.spell[type]?.scaling ?? 100)),
    })),
    attributes: allAttributes.map((stat) => ({ stat, ...difference(a[stat], b[stat]) })),
    offensiveTotal: difference(
      allAttributes.reduce((sum, stat) => sum + a[stat], 0),
      allAttributes.reduce((sum, stat) => sum + b[stat], 0)
    ),
    unmetA: resultA.unmet,
    unmetB: resultB.unmet,
    requirementsMet: resultA.unmet.filter((stat) => !resultB.unmet.includes(stat)),
    requirementsLost: resultB.unmet.filter((stat) => !resultA.unmet.includes(stat)),
  };
}

// buildCurve is a TypeScript port of evaluateCalcCorrectGraph from
// github.com/ThomasJClark/elden-ring-weapon-calculator
// (MIT License, Copyright (c) 2022 Tom Clark).
// See THIRD_PARTY_LICENSE-elden-ring-weapon-calculator.txt
import type { Attribute } from "../attributes";
import type { Curve } from "../curves";
import type { AttackElementCorrect, DamageType, Weapon } from "../weapon";

export const DAMAGE_TYPES: readonly DamageType[] = ["physical", "magic", "fire", "lightning", "holy"];
const DEFAULT_GRAPH_ID = 0;

// A curve is stored as a few stages. Turn it into an array: curve[stat] for stat 0..148
// (148 because two-handing can push Strength to 99 * 1.5).
function buildCurve(stages: { maxVal: number; maxGrowVal: number; adjPt: number }[]): Curve {
  const curve: Curve = new Array(149).fill(0);
  for (let i = 1; i < stages.length; i++) {
    const prev = stages[i - 1];
    const stage = stages[i];
    const from = i === 1 ? 1 : prev.maxVal + 1;
    const to = i === stages.length - 1 ? 148 : stage.maxVal;
    for (let stat = from; stat <= to; stat++) {
      let ratio = (stat - prev.maxVal) / (stage.maxVal - prev.maxVal);
      ratio = Math.max(0, Math.min(1, ratio));
      if (prev.adjPt > 0) ratio = ratio ** prev.adjPt;
      else if (prev.adjPt < 0) ratio = 1 - (1 - ratio) ** -prev.adjPt;
      curve[stat] = prev.maxGrowVal + (stage.maxGrowVal - prev.maxGrowVal) * ratio;
    }
  }
  return curve;
}

// Returns a function that turns one raw weapon record into a finished weapon.
// Curves are cached, because most weapons share the same few curves.
export function makeBuilder(data: any) {
  const curveCache = new Map<number, Curve>();
  const getCurve = (id: number): Curve => {
    if (!curveCache.has(id)) curveCache.set(id, buildCurve(data.calcCorrectGraphs[id]));
    return curveCache.get(id)!;
  };

  return function buildWeapon(w: any): Weapon {
    const reinforce: any[] = data.reinforceTypes[w.reinforceTypeId];
    const correct = data.attackElementCorrects[w.attackElementCorrectId];

    const attack: Weapon["attack"] = reinforce.map((row) => {
      const level: Partial<Record<DamageType, number>> = {};
      for (const [id, base] of w.attack as [number, number][]) {
        if (id > 4) continue; // ignore status buildup
        level[DAMAGE_TYPES[id]] = base * (row.attack[id] ?? 0);
      }
      return level;
    });

    const attributeScaling: Weapon["attributeScaling"] = reinforce.map((row) => {
      const level: Partial<Record<Attribute, number>> = {};
      for (const [stat, base] of w.attributeScaling as [Attribute, number][]) {
        level[stat] = base * row.attributeScaling[stat];
      }
      return level;
    });

    const attackElementCorrect: AttackElementCorrect = {};
    DAMAGE_TYPES.forEach((type, id) => {
      const map: Partial<Record<Attribute, number | true>> = {};
      const entries = Object.entries(correct[id] ?? {}) as [Attribute, number | true][];
      for (const [stat, value] of entries) {
        if (value) map[stat] = value;
      }
      if (Object.keys(map).length > 0) attackElementCorrect[type] = map;
    });

    const calcCorrectGraphs = {} as Weapon["calcCorrectGraphs"];
    DAMAGE_TYPES.forEach((type, id) => {
      calcCorrectGraphs[type] = getCurve(w.calcCorrectGraphIds?.[id] ?? DEFAULT_GRAPH_ID);
    });

    return {
      name: w.name,
      weaponType: w.weaponType,
      paired: w.paired ?? false,
      requirements: w.requirements,
      attack,
      attributeScaling,
      attackElementCorrect,
      calcCorrectGraphs,
    };
  };
}
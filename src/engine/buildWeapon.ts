// buildCurve is a TypeScript port of evaluateCalcCorrectGraph from
// github.com/ThomasJClark/elden-ring-weapon-calculator
// (MIT License, Copyright (c) 2022 Tom Clark).
// See THIRD_PARTY_LICENSE-elden-ring-weapon-calculator.txt
import type { Attribute } from "../attributes";
import type { Curve } from "../curves";
import type { RegulationData, RawWeapon } from "../regulationData";
import {
  allStatusTypes,
  ARC_SCALED_STATUS,
  type AttackElementCorrect,
  type DamageType,
  type StatusType,
  type Weapon,
} from "../weapon";

export const DAMAGE_TYPES: readonly DamageType[] = ["physical", "magic", "fire", "lightning", "holy"];

// the numbers the game data uses for each status effect (checked by buildWeapon.test.ts)
export const STATUS_IDS: Record<StatusType, number> = {
  poison: 5,
  scarletRot: 6,
  bleed: 7,
  frost: 8,
  sleep: 9,
  madness: 10,
  deathBlight: 11,
};

const DEFAULT_GRAPH_ID = 0;
const DEFAULT_STATUS_GRAPH_ID = 6;

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
export function makeBuilder(data: RegulationData) {
  const curveCache = new Map<number, Curve>();
  const getCurve = (id: number): Curve => {
    if (!curveCache.has(id)) curveCache.set(id, buildCurve(data.calcCorrectGraphs[id]));
    return curveCache.get(id)!;
  };

  return function buildWeapon(w: RawWeapon): Weapon {
    const reinforce: any[] = data.reinforceTypes[w.reinforceTypeId];
    const correct = data.attackElementCorrects[w.attackElementCorrectId];

    const attack: Weapon["attack"] = reinforce.map((row) => {
      const level: Partial<Record<DamageType, number>> = {};
      for (const [id, base] of w.attack as [number, number][]) {
        if (id > 4) continue; // status buildup is built below
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

    // status buildup per level: the weapon points at status parameters, and each upgrade
    // level shifts the parameter id by an offset
    const status = reinforce.map((row) => {
      const level: Partial<Record<StatusType, number>> = {};
      const offsets = [row.statusSpEffectId1, row.statusSpEffectId2, row.statusSpEffectId3];
      ((w.statusSpEffectParamIds ?? []) as number[]).forEach((id, i) => {
        if (!id) return;
        const param = data.statusSpEffectParams[id + (offsets[i] ?? 0)];
        if (!param) return;
        for (const type of allStatusTypes) {
          const value = param[STATUS_IDS[type]];
          if (value) level[type] = value;
        }
      });
      return level;
    });
    const hasStatus = status.some((level) => Object.keys(level).length > 0);

    const statusCurves: Partial<Record<StatusType, Curve>> = {};
    if (hasStatus) {
      for (const type of ARC_SCALED_STATUS) {
        statusCurves[type] = getCurve(
          w.calcCorrectGraphIds?.[STATUS_IDS[type]] ?? DEFAULT_STATUS_GRAPH_ID
        );
      }
    }

    return {
      name: w.name,
      affinityId: w.affinityId,
      weaponName: w.weaponName,
      url: w.url,
      weaponType: w.weaponType,
      paired: w.paired ?? false,
      sorceryTool: w.sorceryTool ?? false,
      incantationTool: w.incantationTool ?? false,
      dlc: w.dlc ?? false,
      requirements: w.requirements,
      attack,
      attributeScaling,
      attackElementCorrect,
      calcCorrectGraphs,
      status: hasStatus ? status : undefined,
      statusCurves: hasStatus ? statusCurves : undefined,
    };
  };
}

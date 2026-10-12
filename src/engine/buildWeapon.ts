// buildCurve is a TypeScript port of evaluateCalcCorrectGraph from
// github.com/ThomasJClark/elden-ring-weapon-calculator
// (MIT License, Copyright (c) 2022 Tom Clark). See THIRD_PARTY_LICENSE-elden-ring-weapon-calculator.txt
export const DAMAGE_TYPES = ["physical", "magic", "fire", "lightning", "holy"] as const;
const DEFAULT_GRAPH_ID = 0;

// A curve is stored as a few stages. Turn it into an array: curve[stat] for stat 0..148
// (148 because two-handing can push Strength to 99 * 1.5).
function buildCurve(stages: { maxVal: number; maxGrowVal: number; adjPt: number }[]): number[] {
  const curve: number[] = new Array(149).fill(0);
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
  const curveCache = new Map<number, number[]>();
  const getCurve = (id: number) => {
    if (!curveCache.has(id)) curveCache.set(id, buildCurve(data.calcCorrectGraphs[id]));
    return curveCache.get(id)!;
  };

  return function buildWeapon(w: any) {
    const reinforce = data.reinforceTypes[w.reinforceTypeId];
    const correct = data.attackElementCorrects[w.attackElementCorrectId];

    const attack = reinforce.map((row: any) => {
      const level: Record<string, number> = {};
      for (const [id, base] of w.attack) {
        if (id > 4) continue; // ignore status buildup
        level[DAMAGE_TYPES[id]] = base * (row.attack[id] ?? 0);
      }
      return level;
    });

    const attributeScaling = reinforce.map((row: any) => {
      const level: Record<string, number> = {};
      for (const [stat, base] of w.attributeScaling) {
        level[stat] = base * row.attributeScaling[stat];
      }
      return level;
    });

    const attackElementCorrect: Record<string, Record<string, number | true>> = {};
  DAMAGE_TYPES.forEach((type, id) => {
  const map: Record<string, number | true> = {};
  for (const [stat, value] of Object.entries(correct[id] ?? {})) {
    if (value) map[stat] = value as number | true;
  }
  if (Object.keys(map).length > 0) attackElementCorrect[type] = map;
});

    const calcCorrectGraphs: Record<string, number[]> = {};
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
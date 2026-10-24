import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { RegulationData } from "../regulationData";
import { calculateARDetail } from "../calculateAR";
import { makeBuilder } from "../engine/buildWeapon";
import {
  DATA_VERSION, MAX_SHARE_WEAPONS, decodeComparison, encodeComparison,
  stableWeaponId, type ComparisonState,
} from "./shareComparison";

const data: RegulationData = JSON.parse(
  readFileSync(resolve("public/data/regulation-vanilla-v1.17.json"), "utf8")
);
const indexOf = (name: string) => {
  const index = data.weapons.findIndex((weapon) => weapon.name === name);
  if (index < 0) throw new Error(`Missing test weapon: ${name}`);
  return index;
};
const moonveil = indexOf("Moonveil");
const heavyUchi = indexOf("Heavy Uchigatana");
const state: ComparisonState = {
  statText: { str: "18", dex: "24", int: "40", fai: "10", arc: "60" },
  picked: [moonveil, heavyUchi],
  levels: { [moonveil]: 10, [heavyUchi]: 12 },
  twoHandings: { [moonveil]: false, [heavyUchi]: true },
};

function payload(overrides: Record<string, unknown> = {}) {
  return `#build=${encodeURIComponent(JSON.stringify({
    v: 1, patch: DATA_VERSION, stats: [18, 24, 40, 10, 60],
    weapons: [
      { id: stableWeaponId(data.weapons[moonveil]), level: 10, twoHanding: false },
      { id: stableWeaponId(data.weapons[heavyUchi]), level: 12, twoHanding: true },
    ],
    ...overrides,
  }))}`;
}

describe("versioned comparison links", () => {
  it("has unique stable IDs for every weapon/affinity record", () => {
    const ids = data.weapons.map(stableWeaponId);
    expect(new Set(ids).size).toBe(data.weapons.length);
    expect(stableWeaponId(data.weapons[heavyUchi])).toBe("1:Uchigatana");
  });

  it("round-trips stats, selection order, upgrade levels and handing", () => {
    expect(decodeComparison(encodeComparison(state, data), data))
      .toEqual({ state, warnings: [] });
  });

  it("restores the same weapons and calculations after dataset reordering", () => {
    const reordered = { ...data, weapons: [...data.weapons].reverse() };
    const restored = decodeComparison(encodeComparison(state, data), reordered)!.state;
    const build = makeBuilder(data);
    const stats = { vig: 20, mnd: 10, end: 20, str: 18, dex: 24, int: 40, fai: 10, arc: 60 };
    expect(restored.picked.map((index) => reordered.weapons[index].name))
      .toEqual(["Moonveil", "Heavy Uchigatana"]);
    state.picked.forEach((originalIndex, position) => {
      const index = restored.picked[position];
      expect(calculateARDetail(build(reordered.weapons[index]), stats, restored.levels[index], restored.twoHandings[index]))
        .toEqual(calculateARDetail(build(data.weapons[originalIndex]), stats, state.levels[originalIndex], state.twoHandings[originalIndex]));
    });
  });

  it("encodes Unicode and punctuation in names without losing identifiers", () => {
    const index = indexOf("Marais Executioner's Sword");
    const special = { ...state, picked: [index], levels: { [index]: 5 }, twoHandings: { [index]: true } };
    expect(decodeComparison(encodeComparison(special, data), data)!.state).toEqual(special);
  });

  it("supports an empty comparison and boundary attributes", () => {
    const empty: ComparisonState = {
      statText: { str: "1", dex: "99", int: "1", fai: "99", arc: "1" },
      picked: [], levels: {}, twoHandings: {},
    };
    expect(decodeComparison(encodeComparison(empty, data), data)!.state).toEqual(empty);
  });

  it("ignores unrelated hashes", () => {
    expect(decodeComparison("", data)).toBeNull();
    expect(decodeComparison("#credits", data)).toBeNull();
  });

  it.each(["#build=%", "#build={", "#build=null", "#build=[]"])("rejects malformed input %s", (hash) => {
    expect(() => decodeComparison(hash, data)).toThrow("invalid");
  });

  it("rejects unsupported versions without guessing their schema", () => {
    expect(() => decodeComparison(payload({ v: 2 }), data)).toThrow("unsupported format version");
  });

  it.each([
    [0, 24, 40, 10, 60], [100, 24, 40, 10, 60], [18.5, 24, 40, 10, 60],
    ["18", 24, 40, 10, 60], [18, 24], [null, 24, 40, 10, 60],
  ])("rejects invalid attributes %j", (...stats) => {
    expect(() => decodeComparison(payload({ stats }), data)).toThrow("invalid");
  });

  it.each([
    { level: -1 }, { level: 0.5 }, { level: 11 }, { level: 26 }, { twoHanding: "false" }, { id: 123 },
  ])("rejects invalid weapon settings %j", (changes) => {
    const entry = { id: stableWeaponId(data.weapons[moonveil]), level: 10, twoHanding: false, ...changes };
    expect(() => decodeComparison(payload({ weapons: [entry] }), data)).toThrow("invalid");
  });

  it("rejects duplicate selections", () => {
    const entry = { id: stableWeaponId(data.weapons[moonveil]), level: 10, twoHanding: false };
    expect(() => decodeComparison(payload({ weapons: [entry, entry] }), data)).toThrow("invalid");
  });

  it("skips missing weapons with a visible warning and keeps available ones", () => {
    const reduced = { ...data, weapons: data.weapons.filter((_, index) => index !== moonveil) };
    const restored = decodeComparison(encodeComparison(state, data), reduced)!;
    expect(restored.state.picked.map((index) => reduced.weapons[index].name)).toEqual(["Heavy Uchigatana"]);
    expect(restored.warnings).toEqual(["1 weapon(s) are unavailable in this dataset and were skipped."]);
  });

  it("warns when a different data patch is requested", () => {
    const restored = decodeComparison(payload({ patch: "1.16" }), data)!;
    expect(restored.state).toEqual(state);
    expect(restored.warnings[0]).toContain(`Results now use patch ${DATA_VERSION}`);
  });

  it("rejects an ambiguous dataset rather than silently picking the wrong record", () => {
    expect(() => decodeComparison(payload(), { ...data, weapons: [...data.weapons, data.weapons[0]] }))
      .toThrow("ambiguous");
  });

  it("bounds input size and selection count", () => {
    expect(() => decodeComparison(`#build=${"x".repeat(32000)}`, data)).toThrow("invalid");
    expect(() => decodeComparison(payload({ weapons: Array(MAX_SHARE_WEAPONS + 1).fill({}) }), data)).toThrow("invalid");
    expect(() => encodeComparison({ ...state, picked: Array(MAX_SHARE_WEAPONS + 1).fill(moonveil) }, data)).toThrow("up to 100 weapons");
  });
});

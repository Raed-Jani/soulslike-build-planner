import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { RegulationData } from "../regulationData";
import { makeBuilder } from "./buildWeapon";
import { compareDistributions } from "./compareDistributions";

const data: RegulationData = JSON.parse(readFileSync(resolve("public/data/regulation-vanilla-v1.17.json"), "utf8"));
const build = makeBuilder(data);
function weapon(name: string) {
  const raw = data.weapons.find((record) => record.name === name);
  if (!raw) throw new Error(`Missing weapon: ${name}`);
  return build(raw);
}
const a = { vig: 20, mnd: 10, end: 20, str: 12, dex: 24, int: 22, fai: 10, arc: 12 };

describe("manual stat distribution comparison", () => {
  it("keeps element rows separate when raw scaling differs despite identical rounding", () => {
    const base = weapon("Finger Seal");
    const magic = [...base.calcCorrectGraphs.magic];
    const holy = [...base.calcCorrectGraphs.holy];
    magic[20] = 0.251;
    holy[20] = 0.252;
    const stats = { ...a, str: 20 };
    const result = compareDistributions({
      ...base, attack: [{ physical: 100 }], attributeScaling: [{ str: 1 }],
      attackElementCorrect: { magic: { str: true }, holy: { str: true } },
      calcCorrectGraphs: { ...base.calcCorrectGraphs, magic, holy },
    }, stats, stats, 0, false);
    expect(result.spell.map((row) => row.a)).toEqual([125, 125]);
    expect(result.uniformSpell).toBe(false);
  });
  it("compares different affinity records of the same base weapon", () => {
    const stats = { ...a, str: 18, dex: 18, int: 40, arc: 60 };
    const result = compareDistributions(weapon("Uchigatana"), stats, stats, 25, false, { level: 25, twoHanding: false }, weapon("Cold Uchigatana"));
    expect(result.damage.find((row) => row.type === "magic")).toMatchObject({ a: 0, b: 242 });
    expect(result.damage.find((row) => row.type === "physical")!.b).toBe(274);
    expect(result.status.find((row) => row.type === "frost")).toMatchObject({ a: 0, b: 105, delta: 105 });
  });

  it("groups spell scaling only when both configurations are uniform", () => {
    const result = compareDistributions(weapon("Finger Seal"), { ...a, fai: 40 }, { ...a, fai: 50 }, 25, false);
    expect(result.uniformSpell).toBe(true);
  });
  it("uses B's own upgrade level and handing instead of A's settings", () => {
    const stats = { ...a, str: 18, dex: 18 };
    const result = compareDistributions(weapon("Uchigatana"), stats, stats, 0, false, { level: 25, twoHanding: true });
    expect(result.total.a).toBe(141);
    expect(result.total.b).toBeGreaterThan(300);
    expect(result.offensiveTotal.delta).toBe(0);
    const handing = compareDistributions(weapon("Greatsword"), { ...a, str: 21 }, { ...a, str: 21 }, 25, false, { level: 25, twoHanding: true });
    expect(handing.unmetA).toContain("str");
    expect(handing.unmetB).not.toContain("str");
  });
  it.each([
    { name: "Finger Seal", stat: "fai" as const, before: 221, after: 254 },
    { name: "Glintstone Staff", stat: "int" as const, before: 224, after: 257 },
  ])("compares $name spell-scaling percentages separately from attack rating", ({ name, stat, before, after }) => {
    // Reference calculator, patch 1.17, +25: 40 → 50 in the casting attribute.
    const result = compareDistributions(weapon(name), { ...a, [stat]: 40 }, { ...a, [stat]: 50 }, 25, false);
    expect(result.spell).toHaveLength(5);
    for (const row of result.spell) expect(row).toMatchObject({ a: before, b: after, delta: after - before });
    expect(result.damage.length).toBeGreaterThan(0);
  });

  it("flags catalyst requirement removal alongside its scaling increase", () => {
    const result = compareDistributions(weapon("Finger Seal"), { ...a, fai: 9 }, { ...a, fai: 10 }, 25, false);
    expect(result.spell.find(({ type }) => type === "holy")).toMatchObject({ a: 60, b: 126, delta: 66 });
    expect(result.unmetA).toEqual(["fai"]);
    expect(result.unmetB).toEqual([]);
    expect(result.requirementsMet).toEqual(["fai"]);
  });

  it("equal distributions produce equal outcomes and zero deltas", () => {
    const result = compareDistributions(weapon("Moonveil"), a, { ...a }, 10, false);
    expect(result.total.delta).toBe(0);
    expect(result.damage.every((row) => row.delta === 0)).toBe(true);
    expect(result.status.every((row) => row.delta === 0)).toBe(true);
  });

  it("compares golden requirement-boundary outputs, with distinct AR and buildup", () => {
    const result = compareDistributions(weapon("Reduvia"), a, { ...a, arc: 13 }, 5, false);
    expect(result.total).toEqual({ a: 81, b: 191, delta: 110 });
    expect(result.status).toEqual([{ type: "bleed", a: 30, b: 51, delta: 21 }]);
    expect(result.requirementsMet).toEqual(["arc"]);
    expect(result.requirementsLost).toEqual([]);
    expect(result.offensiveTotal.delta).toBe(1);
  });

  it("identifies newly lost requirements and negative deltas", () => {
    const result = compareDistributions(weapon("Reduvia"), { ...a, arc: 13 }, a, 5, false);
    expect(result.total.delta).toBe(-110);
    expect(result.requirementsLost).toEqual(["arc"]);
    expect(result.unmetB).toEqual(["arc"]);
  });

  it("retains split damage and the independently rounded total", () => {
    const result = compareDistributions(weapon("Moonveil"), { ...a, int: 40, arc: 10 }, { ...a, int: 23, arc: 10 }, 10, false);
    expect(result.total).toEqual({ a: 605, b: 552, delta: -53 });
    expect(result.damage).toEqual([
      { type: "physical", a: 238, b: 238, delta: 0 },
      { type: "magic", a: 366, b: 314, delta: -52 },
    ]);
  });

  it("distinguishes redistribution from additional offensive attribute points", () => {
    const result = compareDistributions(weapon("Uchigatana"), { ...a, str: 22 }, { ...a, str: 12, dex: 34 }, 25, false);
    expect(result.offensiveTotal.delta).toBe(0);
    expect(result.attributes.find((row) => row.stat === "str")!.delta).toBe(-10);
    expect(result.attributes.find((row) => row.stat === "dex")!.delta).toBe(10);
  });

  it("uses the same selected level and handing mode for both configurations", () => {
    const b = { ...a, str: 21 };
    const oneHanded = compareDistributions(weapon("Greatsword"), { ...a, str: 20 }, b, 25, false);
    const twoHanded = compareDistributions(weapon("Greatsword"), { ...a, str: 20 }, b, 25, true);
    expect(oneHanded.requirementsMet).toEqual([]);
    expect(twoHanded.requirementsMet).toEqual(["str"]);
    expect(compareDistributions(weapon("Reduvia"), a, { ...a, arc: 13 }, 0, false).total.delta)
      .not.toBe(compareDistributions(weapon("Reduvia"), a, { ...a, arc: 13 }, 10, false).total.delta);
  });

  it("preserves inputs and handles capped stats and weapons without status", () => {
    const capped = { ...a, str: 99, dex: 99 };
    const copy = { ...capped };
    const result = compareDistributions(weapon("Longsword"), capped, { ...capped }, 25, true);
    expect(result.total.delta).toBe(0);
    expect(result.status).toEqual([]);
    expect(capped).toEqual(copy);
  });
});

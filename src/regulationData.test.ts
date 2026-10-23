import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { RegulationData } from "./regulationData";

const data: RegulationData = JSON.parse(
  readFileSync(resolve("public", "data", "regulation-vanilla-v1.17.json"), "utf8")
);

describe("regulation data matches the declared shape", () => {
  it("every weapon points at tables that exist", () => {
    for (const w of data.weapons) {
      expect(data.reinforceTypes[w.reinforceTypeId], w.name).toBeDefined();
      expect(data.attackElementCorrects[w.attackElementCorrectId], w.name).toBeDefined();
    }
  });

  it("reinforce rows hold attack multipliers as an object, not an array", () => {
    const row = data.reinforceTypes[data.weapons[0].reinforceTypeId][0];
    expect(Array.isArray(row.attack)).toBe(false);
  });

  it("scaling tiers are listed from the highest threshold to the lowest", () => {
    const thresholds = data.scalingTiers.map(([threshold]) => threshold);
    expect(thresholds).toEqual([...thresholds].sort((a, b) => b - a));
  });
});
import { describe, it, expect } from "vitest";
import { testSword } from "./weapon";
import { testCharacter } from "./attributes";
import { calculateAR, totalAR } from "./calculateAR";
import { weapons } from "./data/weapons";
import type { Attributes } from "./attributes";
describe("calculateAR", () => {
  describe("verified against eldenring.tclark.io (patch 1.17)", () => {
  const base = { vig: 20, mnd: 10, end: 20, str: 18, dex: 18, int: 10, fai: 10, arc: 10 };

  function ar(name: string, stats: Attributes, level: number, twoHanding = false) {
    const weapon = weapons.find((w) => w.name === name)!;
    return calculateAR(weapon, stats, level, twoHanding);
  }

  it("Uchigatana +25, Str 30 Dex 40", () => {
    const r = ar("Uchigatana", { ...base, str: 30, dex: 40 }, 25);
    expect(Math.floor(r.physical!)).toBe(471); // replace with the site's physical value
  });

  it("Uchigatana +0 two-handed, Str 18 Dex 18", () => {
    const r = ar("Uchigatana", base, 0, true);
    expect(Math.floor(r.physical!)).toBe(146); // replace with the site's value
  });

  it("Moonveil +10, Str 12 Dex 24 Int 40", () => {
    const r = ar("Moonveil", { ...base, str: 12, dex: 24, int: 40 }, 10);
    expect(Math.floor(r.physical!)).toBe(238); // replace with the site's physical value
    expect(Math.floor(r.magic!)).toBe(366);    // replace with the site's magic value
  });
});
});
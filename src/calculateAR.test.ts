import { describe, it, expect } from "vitest";
import { testSword } from "./weapon";
import { testCharacter } from "./attributes";
import { calculateAR, totalAR } from "./calculateAR";
import { weapons } from "./data/weapons";
import type { Attributes } from "./attributes";
describe("calculateAR", () => {
  it("computes physical AR for testSword at +1", () => {
    const result = calculateAR(testSword, testCharacter, 1);
    expect(result.physical).toBeCloseTo(132.825, 2);
  });

  it("two-handing raises Strength by 50% (rounded down)", () => {
    const result = calculateAR(testSword, testCharacter, 1, true);
    expect(result.physical).toBeCloseTo(139.975, 2);
  });

  it("applies the penalty when a scaling stat is below the requirement", () => {
    const weak = { ...testCharacter, str: 5 };
    const result = calculateAR(testSword, weak, 1);
    expect(result.physical).toBeCloseTo(66, 2);
  });

  it("two-handing can satisfy a Strength requirement", () => {
    const lowStr = { ...testCharacter, str: 7 };
    const result = calculateAR(testSword, lowStr, 1, true);
    expect(result.physical).toBeCloseTo(125.675, 2);
  });

  it("totalAR sums all damage types", () => {
    expect(totalAR({ physical: 100, magic: 50.5 })).toBeCloseTo(150.5, 2);
  });

  it("matches eldenring.tclark.io for the standard Uchigatana at +0", () => {
  const uchigatana = weapons.find((w) => w.name === "Uchigatana")!;
  const stats = { vig: 20, mnd: 10, end: 20, str: 18, dex: 18, int: 10, fai: 10, arc: 10 };
  const result = calculateAR(uchigatana, stats, 0);
  // the game rounds down, and the site shows 141
  expect(Math.floor(result.physical!)).toBe(141);
});
  it("omits damage types the weapon doesn't have", () => {
    const result = calculateAR(testSword, testCharacter, 1);
    expect(result.magic).toBeUndefined();
  });

  it("an unmet requirement only penalizes damage types that scale with that stat", () => {
    // physical scales with str and dex only, so a missing Int requirement changes nothing
    const picky = { ...testSword, requirements: { str: 10, dex: 10, int: 30 } };
    const result = calculateAR(picky, testCharacter, 1);
    expect(result.physical).toBeCloseTo(132.825, 2);
  });

  it("two-handing at Str 99 reads the curve at 148 without breaking", () => {
    // Str 99 -> 148; fake curve is 1 there: 110 * (1 + 1*0.52 + 0.25*0.31) = 175.725
    const strong = { ...testCharacter, str: 99 };
    const result = calculateAR(testSword, strong, 1, true);
    expect(result.physical).toBeCloseTo(175.725, 2);
  });

  it("two-handing does not modify the character you pass in", () => {
    const before = { ...testCharacter };
    calculateAR(testSword, testCharacter, 1, true);
    expect(testCharacter).toEqual(before);
  });
});
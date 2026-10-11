import { describe, it, expect } from "vitest";
import { testSword } from "./weapon";
import { testCharacter } from "./attributes";
import { calculateAR, totalAR } from "./calculateAR";
import { weapons } from "./data/weapons";
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

  it("matches a hand calculation for the real Uchigatana at +0", () => {
  const uchigatana = weapons.find((w) => w.name === "Uchigatana")!;
  const stats = { vig: 20, mnd: 10, end: 20, str: 18, dex: 18, int: 10, fai: 10, arc: 10 };
  // curve at stat 18 = 0.25, so 115 * (1 + 0.25*0.36 + 0.25*0.55) = 141.1625
  const result = calculateAR(uchigatana, stats, 0);
  expect(result.physical).toBeCloseTo(141.1625, 2);
});
});
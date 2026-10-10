import { describe, it, expect } from "vitest";
import { testSword } from "./weapon";
import { testCharacter } from "./attributes";
import { calculateAR, totalAR } from "./calculateAR";

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
});
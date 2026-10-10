import { describe, it, expect } from "vitest";
import { calculateAR } from "./calculateAR";
import { testSword } from "./weapon";
import { testCharacter } from "./attributes";

describe("calculateAR", () => {
  it("computes physical AR for testSword at +1", () => {
    const result = calculateAR(testSword, testCharacter, 1);
    expect(result.physical).toBeCloseTo(132.825, 2);
  });
});
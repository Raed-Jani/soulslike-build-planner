/**
 * Shared test fixtures used by calculateAR.test.ts and any other test files.
 * These are NOT used by the production app.
 */
import type { Attributes } from "./attributes";
import type { Weapon } from "./weapon";
import type { Curve } from "./curves";

// FAKE test curve (a straight line that maxes out at stat 80).
export const fakeCurve: Curve = Array.from({ length: 149 }, (_, stat) =>
  Math.min(stat / 80, 1)
);

export const testCharacter: Attributes = {
  vig: 40, mnd: 15, end: 25, str: 20, dex: 20, int: 10, fai: 10, arc: 10,
};

export const testSword: Weapon = {
  name: "Test Sword",
  requirements: { str: 10, dex: 10 },
  attack: [
    { physical: 100 },   // +0
    { physical: 110 },   // +1
  ],
  attributeScaling: [
    { str: 0.5, dex: 0.3 },
    { str: 0.52, dex: 0.31 },
  ],
  attackElementCorrect: {
    physical: { str: true, dex: true },
  },
  calcCorrectGraphs: {
    physical: fakeCurve,
    magic: fakeCurve,
    fire: fakeCurve,
    lightning: fakeCurve,
    holy: fakeCurve,
  },
};

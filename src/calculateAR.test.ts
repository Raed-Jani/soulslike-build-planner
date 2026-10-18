import { fakeCurve } from "./curves";
import { describe, it, expect } from "vitest";
import { testSword } from "./weapon";
import { testCharacter } from "./attributes";
import { calculateAR, totalAR } from "./calculateAR";
import { weapons } from "./data/weapons";
import type { Attributes } from "./attributes";
import {displayAR} from "./calculateAR";
import {calculateARDetail} from "./calculateAR";
import {scalingGrade} from "./calculateAR";

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
  it("paired weapons do not get the two-handing bonus", () => {
    const paired = { ...testSword, paired: true };
    const result = calculateAR(paired, testCharacter, 1, true);
    expect(result.physical).toBeCloseTo(132.825, 2); // same as one-handed
  });

  it("bows are always treated as two-handed", () => {
    const bow = { ...testSword, weaponType: 51 };
    const result = calculateAR(bow, testCharacter, 1, false);
    expect(result.physical).toBeCloseTo(139.975, 2); // same as two-handed
  });

  it("partial scaling uses value * scaling at level / scaling at +0", () => {
    // str partial 0.25 -> 0.25 * 0.52 / 0.5 = 0.26
    // multiplier = 1 + 0.25*0.26 + 0.25*0.31 = 1.1425 -> 110 * 1.1425 = 125.675
    const partial = {
      ...testSword,
      attackElementCorrect: { physical: { str: 0.25, dex: true as const } },
    };
    const result = calculateAR(partial, testCharacter, 1);
    expect(result.physical).toBeCloseTo(125.675, 2);
  });
});
describe("matches the numbers shown on eldenring.tclark.io", () => {
  const stats = { vig: 20, mnd: 10, end: 20, str: 12, dex: 24, int: 40, fai: 10, arc: 10 };

  it("Moonveil +10: physical 238, magic 366, total 605", () => {
    const moonveil = weapons.find((w) => w.name === "Moonveil")!;
    const shown = displayAR(calculateAR(moonveil, stats, 10));
    expect(shown.parts.physical).toBe(238);
    expect(shown.parts.magic).toBe(366);
    expect(shown.total).toBe(605);
  });

  it("Uchigatana +25: 382", () => {
    const uchigatana = weapons.find((w) => w.name === "Uchigatana")!;
    const shown = displayAR(calculateAR(uchigatana, stats, 25));
    expect(shown.parts.physical).toBe(382);
    expect(shown.total).toBe(382);
  });
});
describe("detail and scaling letters", () => {
  // from regulation-vanilla-v1.17 (data.scalingTiers)
  const tiers: [number, string][] = [
    [1.75, "S"], [1.4, "A"], [0.9, "B"], [0.6, "C"], [0.25, "D"], [0.01, "E"],
  ];

  it("scalingGrade picks the first tier whose threshold is reached", () => {
    expect(scalingGrade(1.9, tiers)).toBe("S");
    expect(scalingGrade(0.6, tiers)).toBe("C"); // threshold counts as reached
    expect(scalingGrade(0.59, tiers)).toBe("D");
    expect(scalingGrade(0.01, tiers)).toBe("E");
    expect(scalingGrade(0.005, tiers)).toBe("-");
    expect(scalingGrade(undefined, tiers)).toBe("-");
  });

  it("calculateARDetail splits base and bonus", () => {
    const detail = calculateARDetail(testSword, testCharacter, 1);
    expect(detail.damage.physical!.base).toBeCloseTo(110, 3);
    expect(detail.damage.physical!.bonus).toBeCloseTo(22.825, 3);
    expect(detail.damage.physical!.total).toBeCloseTo(132.825, 3);
    expect(detail.damage.physical!.penalized).toBe(false);
    expect(detail.unmet).toEqual([]);
  });

  it("calculateARDetail reports unmet requirements and the penalty", () => {
    const weak = { ...testCharacter, str: 5 };
    const detail = calculateARDetail(testSword, weak, 1);
    expect(detail.unmet).toEqual(["str"]);
    expect(detail.damage.physical!.penalized).toBe(true);
    expect(detail.damage.physical!.total).toBeCloseTo(66, 3);
    expect(detail.damage.physical!.bonus).toBeCloseTo(-44, 3);
  });

  it("scaling letters match eldenring.tclark.io", () => {
    const grade = (name: string, level: number, stat: "str" | "dex" | "int") =>
      scalingGrade(weapons.find((w) => w.name === name)!.attributeScaling[level][stat], tiers);

    // Moonveil +10: Str E, Dex B, Int B
    expect(grade("Moonveil", 10, "str")).toBe("E");
    expect(grade("Moonveil", 10, "dex")).toBe("B");
    expect(grade("Moonveil", 10, "int")).toBe("B");
    // Uchigatana +25: Str D, Dex C (no Int scaling)
    expect(grade("Uchigatana", 25, "str")).toBe("D");
    expect(grade("Uchigatana", 25, "dex")).toBe("C");
    expect(grade("Uchigatana", 25, "int")).toBe("-");
  });
});
describe("status buildup", () => {
  const stats = { vig: 20, mnd: 10, end: 20, str: 12, dex: 24, int: 40, fai: 10, arc: 10 };
  const bleed = (name: string, level: number) => {
    const weapon = weapons.find((w) => w.name === name)!;
    return Math.floor(calculateARDetail(weapon, stats, level).status.bleed!.total);
  };

  it("matches the blood loss shown on eldenring.tclark.io", () => {
    expect(bleed("Uchigatana", 25)).toBe(45);
    expect(bleed("Moonveil", 10)).toBe(50);
  });

  it("weapons without status have none", () => {
    expect(calculateARDetail(testSword, testCharacter, 1).status).toEqual({});
  });

  it("Arcane scales blood loss, and a missing Arcane requirement penalizes it", () => {
    const bleeder = {
      ...testSword,
      status: [{}, { bleed: 50 }],
      statusCurves: { bleed: fakeCurve },
      attributeScaling: [
        testSword.attributeScaling[0],
        { ...testSword.attributeScaling[1], arc: 0.5 },
      ],
    };
    // Arcane 10: fakeCurve(10) = 0.125, so 50 * (1 + 0.125 * 0.5) = 53.125
    expect(calculateARDetail(bleeder, testCharacter, 1).status.bleed!.total).toBeCloseTo(53.125, 3);

    const demanding = { ...bleeder, requirements: { ...bleeder.requirements, arc: 20 } };
    const detail = calculateARDetail(demanding, testCharacter, 1);
    expect(detail.status.bleed!.total).toBeCloseTo(30, 3); // 50 * 0.6
    expect(detail.status.bleed!.penalized).toBe(true);
  });
});
describe("spell scaling", () => {
  // incantation tool: scales holy damage with Faith, but has no holy base damage
  const seal = {
    ...testSword,
    incantationTool: true,
    attackElementCorrect: { holy: { fai: true as const } },
    attributeScaling: [
      testSword.attributeScaling[0],
      { ...testSword.attributeScaling[1], fai: 0.4 },
    ],
  };

  it("reports spell scaling even without base damage of that type", () => {
    const detail = calculateARDetail(seal, testCharacter, 1);
    // Faith 10: fakeCurve(10) = 0.125, so 100 * (1 + 0.125 * 0.4) = 105
    expect(detail.spell.holy!.scaling).toBeCloseTo(105, 3);
    expect(detail.damage.holy).toBeUndefined();
  });

  it("a missing requirement penalizes it", () => {
    const demanding = { ...seal, requirements: { ...seal.requirements, fai: 20 } };
    const detail = calculateARDetail(demanding, testCharacter, 1);
    expect(detail.spell.holy!.scaling).toBeCloseTo(60, 3);
    expect(detail.spell.holy!.penalized).toBe(true);
  });

  it("weapons that are not spell tools report none", () => {
    expect(calculateARDetail(testSword, testCharacter, 1).spell).toEqual({});
  });
});
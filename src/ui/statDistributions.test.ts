import { describe, expect, it } from "vitest";
import { changeConfigurationAffinity, copyAToB, createDistributionPair, distributionAttributes, updateComparisonBaselines, updateConfigurationSettings, updateDistribution } from "./statDistributions";
import { testSword } from "../testFixtures";

const original = { str: "18", dex: "24", int: "40", fai: "10", arc: "12" };

describe("independent stat configurations", () => {
  it("applies top-bar changes to every A without changing B or weapon settings", () => {
    const first = createDistributionPair(original, 25, true, 1);
    const second = updateDistribution(createDistributionPair(original, 10, false, -1), "b", "str", "50");
    const pairs = { 12: first, 42: second };
    const updated = updateComparisonBaselines(pairs, "str", "30");
    expect(updated[12].a.statText.str).toBe("30");
    expect(updated[42].a.statText.str).toBe("30");
    expect(updated[12].b).toBe(first.b);
    expect(updated[42].b.statText.str).toBe("50");
    expect(updated[12].a).toMatchObject({ level: 25, twoHanding: true, affinityId: 1 });
    expect(pairs[12].a.statText.str).toBe("18");
  });

  it("top-bar edits preserve the other independently edited attributes in A", () => {
    const pair = updateDistribution(createDistributionPair(original), "a", "dex", "40");
    const updated = updateComparisonBaselines({ 1: pair }, "fai", "60");
    expect(updated[1].a.statText.dex).toBe("40");
    expect(updated[1].a.statText.fai).toBe("60");
    expect(updated[1].b.statText.fai).toBe("10");
  });
  it("changes only B's affinity and clamps its level to the chosen track", () => {
    const pair = createDistributionPair(original, 25, true, 0);
    const changed = changeConfigurationAffinity(pair, "b", { affinityId: 1, label: "Heavy", weapon: testSword });
    expect(changed.a).toEqual(pair.a);
    expect(changed.b).toMatchObject({ affinityId: 1, level: 1, twoHanding: true });
    expect(copyAToB(changed).b).toMatchObject({ affinityId: 0, level: 25 });
  });
  it("edits B's settings independently and copies all A settings on demand", () => {
    const pair = createDistributionPair(original, 25, true);
    const edited = updateConfigurationSettings(pair, "b", { level: 0, twoHanding: false });
    expect(edited.a).toEqual(pair.a);
    expect(edited.b).toMatchObject({ level: 0, twoHanding: false });
    expect(pair.b).toMatchObject({ level: 25, twoHanding: true });
    expect(copyAToB(edited).b).toMatchObject({ level: 25, twoHanding: true });
  });
  it("copies A to B once without changing A or sharing mutable attributes", () => {
    const pair = updateDistribution(createDistributionPair(original), "b", "str", "40");
    const copied = copyAToB(pair);
    expect(copied.a).toEqual(pair.a);
    expect(copied.b.statText).toEqual(pair.a.statText);
    expect(copied.b.statText).not.toBe(pair.a.statText);
    expect(pair.b.statText.str).toBe("40");
    const edited = updateDistribution(copied, "b", "dex", "50");
    expect(edited.a.statText.dex).toBe("24");
    expect(copied.b.statText.dex).toBe("24");
  });
  it("creates distinct configuration IDs and independently owned attribute copies", () => {
    const pair = createDistributionPair(original);
    expect(pair.a.id).toBe("a");
    expect(pair.b.id).toBe("b");
    expect(pair.a.statText).toEqual(original);
    expect(pair.b.statText).toEqual(original);
    expect(pair.a.statText).not.toBe(pair.b.statText);
    expect(pair.a.statText).not.toBe(original);
  });

  it("editing B does not change A, the original, or another weapon's pair", () => {
    const pair = createDistributionPair(original);
    const otherWeapon = createDistributionPair(original);
    const edited = updateDistribution(pair, "b", "str", "23");
    expect(edited.a).toEqual(pair.a);
    expect(edited.b.statText.str).toBe("23");
    expect(pair.b.statText.str).toBe("18");
    expect(original.str).toBe("18");
    expect(otherWeapon.b.statText.str).toBe("18");
  });

  it("explicitly editing A leaves B unchanged", () => {
    const pair = createDistributionPair(original);
    const edited = updateDistribution(pair, "a", "dex", "30");
    expect(edited.a.statText.dex).toBe("30");
    expect(edited.b).toEqual(pair.b);
    expect(pair.a.statText.dex).toBe("24");
  });

  it("normalizes copied and edited inputs at the calculation boundary", () => {
    const pair = createDistributionPair({ ...original, str: "", dex: "0", arc: "999" });
    expect(pair.a.statText).toMatchObject({ str: "1", dex: "1", arc: "99" });
    const edited = updateDistribution(pair, "b", "fai", "");
    expect(distributionAttributes(edited.b.statText).fai).toBe(1);
  });
});

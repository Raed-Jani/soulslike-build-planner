import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { makeBuilder } from "../../engine/buildWeapon";
import type { RegulationData } from "../../regulationData";
import { createDistributionPair, updateDistribution } from "../statDistributions";
import DistributionComparison from "./DistributionComparison";

const data: RegulationData = JSON.parse(readFileSync(resolve("public/data/regulation-vanilla-v1.17.json"), "utf8"));
const raw = data.weapons.find((weapon) => weapon.name === "Finger Seal")!;
const weapon = makeBuilder(data)(raw);
const base = { str: "12", dex: "24", int: "22", fai: "40", arc: "12" };

function render(faithA: string, faithB: string) {
  const pair = updateDistribution(createDistributionPair({ ...base, fai: faithA }, 25), "b", "fai", faithB);
  return renderToStaticMarkup(<DistributionComparison tiers={data.scalingTiers} weapon={weapon}
    pair={pair} onChange={() => {}} onClose={() => {}} />);
}

describe("catalyst comparison and requirement warnings", () => {
  it("keeps a physical-only weapon table focused on its damage breakdown", () => {
    const sword = makeBuilder(data)(data.weapons.find((entry) => entry.name === "Longsword")!);
    const html = renderToStaticMarkup(<DistributionComparison tiers={data.scalingTiers} weapon={sword}
      pair={createDistributionPair(base, 25)} onChange={() => {}} onClose={() => {}} />);
    expect(html).toContain("Physical AR");
    expect(html).not.toContain(">Total AR<");
    expect(html).toContain("Weapon attack rating");
  });

  it("retains total AR for split-damage weapons", () => {
    const moonveil = makeBuilder(data)(data.weapons.find((entry) => entry.name === "Moonveil")!);
    const html = renderToStaticMarkup(<DistributionComparison tiers={data.scalingTiers} weapon={moonveil}
      pair={createDistributionPair(base, 10)} onChange={() => {}} onClose={() => {}} />);
    expect(html).toContain(">Total AR<");
    expect(html).toContain("Physical AR");
    expect(html).toContain("Magic AR");
  });

  it("prioritizes spell scaling with percentage-point deltas, retaining weapon AR", () => {
    const html = render("40", "50");
    expect(html).toContain("Spell scaling · all elements");
    expect(html).toContain("221");
    expect(html).toContain("254");
    expect(html).toContain("+33 pp");
    expect(html).toContain("Total AR");
    expect(html).not.toContain("Unmet in");
    expect(html.indexOf("Spell scaling (%)")).toBeLessThan(html.indexOf("Displayed results"));
  });

  it("shows only actual unmet warnings above the editors and results", () => {
    const html = render("9", "10");
    expect(html).toContain("Unmet in A: Fai");
    expect(html).not.toContain("Unmet in B");
    expect(html).not.toContain("Unmet in A: None");
    expect(html).toContain("Requirement met in B");
    expect(html.indexOf("Unmet in A")).toBeLessThan(html.indexOf("distribution-editors"));
  });
});

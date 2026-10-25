import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { makeBuilder } from "../../engine/buildWeapon";
import type { RegulationData } from "../../regulationData";
import AffinityScalingPicker from "./AffinityScalingPicker";

const data: RegulationData = JSON.parse(readFileSync(resolve("public/data/regulation-vanilla-v1.17.json"), "utf8"));
const build = makeBuilder(data);
const variants = ["Uchigatana", "Heavy Uchigatana"].map((name, index) => {
  const raw = data.weapons.find((weapon) => weapon.name === name)!;
  return { affinityId: raw.affinityId, label: index === 0 ? "Standard" : "Heavy", weapon: build(raw) };
});
function render(level: number) {
  return renderToStaticMarkup(<AffinityScalingPicker configuration="A" variants={variants} selected={variants[0]}
    level={level} tiers={data.scalingTiers} onSelect={() => {}} />);
}
function standardGrades(html: string) {
  const row = html.match(/<tr[^>]*>.*?<\/tr>/g)!.find((row) => row.includes("Standard affinity"))!;
  return [...row.matchAll(/<td>(.*?)<\/td>/g)].map((match) => match[1]);
}

describe("affinity scaling previews", () => {
  it("uses real current-level grades rather than maximum-level grades", () => {
    expect(standardGrades(render(0))).toEqual(["D", "D", "-", "-", "-"]);
    expect(standardGrades(render(25))).toEqual(["D", "C", "-", "-", "-"]);
  });
  it("includes icons, a checked selection and a named independent radio group", () => {
    const html = render(25);
    expect(html).toContain('aria-label="Configuration A affinity: Standard"');
    const input = html.match(/<input[^>]*aria-label="Standard affinity for Configuration A"[^>]*>/)![0];
    expect(input).toContain('checked=""');
    expect(input).toMatch(/name="[^"]+"/);
    expect(html).toContain("standardAffinity.webp");
    expect(html).toContain("heavyAffinity.webp");
    expect(html).toContain("Grades alone do not determine attack rating");
  });
  it("renders a fixed-affinity label instead of an unnecessary picker", () => {
    const html = renderToStaticMarkup(<AffinityScalingPicker configuration="B" variants={[variants[0]]}
      selected={variants[0]} level={25} tiers={data.scalingTiers} onSelect={() => {}} />);
    expect(html).toContain("fixed");
    expect(html).not.toContain("<details");
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { AFFINITIES } from "./affinities";

const data = JSON.parse(
  readFileSync(resolve("public", "data", "regulation-vanilla-v1.17.json"), "utf8")
);

describe("affinity ids match the game data", () => {
  for (const a of AFFINITIES) {
  if (a.id <= 0) continue;
  it(`${a.label} weapons have "${a.label}" in their name`, () => {
    const found = data.weapons.filter((w: any) => w.affinityId === a.id);
    expect(found.length).toBeGreaterThan(0);
    const offenders = found
      .filter((w: any) => !w.name.includes(a.label))
      .map((w: any) => w.name);
    expect(offenders).toEqual([]);
  });
}

  it("every affinityId in the data is known", () => {
    const known = new Set<number>(AFFINITIES.map((a) => a.id));
    const unknown = new Set(
      data.weapons.map((w: any) => w.affinityId).filter((id: number) => !known.has(id))
    );
    expect([...unknown]).toEqual([]);
  });
});
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { makeBuilder } from "./buildWeapon";

const data = JSON.parse(
  readFileSync(resolve("public", "data", "regulation-vanilla-v1.17.json"), "utf8")
);
const build = makeBuilder(data);

function statusKeysOfAffinity(affinityId: number) {
  const keys = new Set<string>();
  for (const raw of data.weapons) {
    if (raw.affinityId !== affinityId) continue;
    for (const level of build(raw).status ?? []) {
      for (const key of Object.keys(level)) keys.add(key);
    }
  }
  return keys;
}

describe("status effect ids match the game data", () => {
  it("Blood affinity weapons build blood loss", () => {
    expect(statusKeysOfAffinity(11).has("bleed")).toBe(true);
  });
  it("Cold affinity weapons build frostbite", () => {
    expect(statusKeysOfAffinity(9).has("frost")).toBe(true);
  });
  it("Poison affinity weapons build poison", () => {
    expect(statusKeysOfAffinity(10).has("poison")).toBe(true);
  });
});
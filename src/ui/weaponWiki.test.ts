import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { RegulationData } from "../regulationData";
import { makeBuilder } from "../engine/buildWeapon";
import { weaponWikiUrl } from "./weaponWiki";

const data: RegulationData = JSON.parse(
  readFileSync(resolve("public/data/regulation-vanilla-v1.17.json"), "utf8")
);
const build = makeBuilder(data);

function linkFor(name: string) {
  const raw = data.weapons.find((weapon) => weapon.name === name);
  if (!raw) throw new Error(`Missing test weapon: ${name}`);
  return weaponWikiUrl(build(raw));
}

describe("weapon wiki links through the runtime builder", () => {
  it("links Erdtree Greatbow to its wiki page", () => {
    expect(linkFor("Erdtree Greatbow")).toBe("https://eldenring.wiki.gg/wiki/Erdtree_Greatbow");
  });

  it("uses the base weapon page for affinity variants", () => {
    expect(linkFor("Heavy Uchigatana")).toBe("https://eldenring.wiki.gg/wiki/Uchigatana");
    expect(linkFor("Cold Uchigatana")).toBe(linkFor("Uchigatana"));
  });

  it("preserves the dataset's disambiguation override", () => {
    expect(linkFor("Madding Hand")).toBe("https://eldenring.wiki.gg/wiki/Madding_Hand_(weapon)");
  });

  it("encodes characters that would otherwise become URL fragments or queries", () => {
    expect(weaponWikiUrl({ weaponName: "Test #1?" }))
      .toBe("https://eldenring.wiki.gg/wiki/Test_%231%3F");
  });

  it("does not invent a link without a base name or when explicitly disabled", () => {
    expect(weaponWikiUrl({})).toBeUndefined();
    expect(weaponWikiUrl({ weaponName: "Uchigatana", url: null })).toBeUndefined();
  });

  it.each(["javascript:alert(1)", "https://example.com/wiki/Test", "not a URL"])(
    "rejects an invalid override: %s", (url) => {
      expect(weaponWikiUrl({ weaponName: "Uchigatana", url })).toBeUndefined();
    }
  );
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { WEAPON_TYPE_GROUPS } from "./weaponTypes";

const data = JSON.parse(
  readFileSync(resolve("public", "data", "regulation-vanilla-v1.17.json"), "utf8")
);
const HIDDEN: number[] = [];

describe("weapon type table", () => {
  it("covers every weaponType in the data except the hidden ones", () => {
    const known = new Set(WEAPON_TYPE_GROUPS.flatMap((g) => g.types.map((t) => t.id)));
    const missing = new Set<number>(
      data.weapons
        .map((w: any) => w.weaponType)
        .filter((id: number) => !known.has(id) && !HIDDEN.includes(id))
    );
    expect([...missing]).toEqual([]);
  });

  it("ids match well-known weapons", () => {
    const expected: [number, string][] = [
      [1, "Dagger"], [3, "Longsword"], [5, "Bastard Sword"], [7, "Greatsword"],
      [9, "Falchion"], [11, "Dismounter"], [13, "Uchigatana"], [14, "Twinblade"],
      [15, "Estoc"], [16, "Sword Lance"], [17, "Battle Axe"], [19, "Greataxe"],
      [21, "Mace"], [23, "Large Club"], [24, "Nightrider Flail"], [25, "Short Spear"],
      [29, "Halberd"], [31, "Scythe"], [35, "Caestus"], [37, "Hookclaws"],
      [39, "Whip"], [41, "Bloodfiend's Arm"], [50, "Shortbow"], [51, "Longbow"],
      [53, "Lion Greatbow"], [55, "Soldier's Crossbow"], [56, "Hand Ballista"],
      [65, "Buckler"], [67, "Kite Shield"], [69, "Dragon Towershield"],
      [88, "Dryleaf Arts"], [89, "Firespark Perfume Bottle"], [90, "Dueling Shield"],
      [91, "Smithscript Dagger"], [92, "Backhand Blade"], [93, "Milady"],
      [94, "Great Katana"], [95, "Beast Claw"],
      [57, "Glintstone Staff"], [61, "Finger Seal"], [87, "Torch"],
    ];
    for (const [id, name] of expected) {
      const weapon = data.weapons.find((w: any) => w.name === name);
      expect(weapon?.weaponType, name).toBe(id);
    }
  });
});
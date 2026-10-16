import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { makeBuilder } from "../src/engine/buildWeapon";
import { calculateAR } from "../src/calculateAR";

const data = JSON.parse(
  readFileSync(resolve("public", "data", "regulation-vanilla-v1.17.json"), "utf8")
);
const build = makeBuilder(data);
const stats = { vig: 20, mnd: 10, end: 20, str: 12, dex: 24, int: 40, fai: 10, arc: 10 };

for (const [name, level] of [["Moonveil", 10], ["Uchigatana", 25]] as const) {
  const weapon = build(data.weapons.find((w: any) => w.name === name));
  console.log(name, level, calculateAR(weapon, stats, level));
}
console.log(JSON.stringify(data.scalingTiers));
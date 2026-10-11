import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// the reference repo sits next to your project folder
const file = resolve("..", "reference-calculator", "public", "regulation-vanilla-v1.17.js");
const text = readFileSync(file, "utf8");

console.log("size:", text.length, "chars");
console.log("starts with:", text.slice(0, 80));

const data = JSON.parse(text);
console.log("top-level keys:", Object.keys(data));
console.log("number of weapons:", data.weapons.length);

const name = process.argv[2] ?? "Uchigatana";
const exact = data.weapons.filter((w: any) => w.name === name);

if (exact.length === 0) {
  console.log(`No exact match for "${name}". Names containing it:`);
  console.log(data.weapons.filter((w: any) => w.name.includes(name)).map((w: any) => w.name));
} else {
  const w = exact[0];
  console.log("WEAPON:", JSON.stringify(w, null, 2));
  console.log("REINFORCE (first 3 levels):", JSON.stringify(data.reinforceTypes[w.reinforceTypeId]?.slice(0, 3), null, 2));
  console.log("ATTACK ELEMENT CORRECT:", JSON.stringify(data.attackElementCorrects[w.attackElementCorrectId], null, 2));
}
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const file = resolve("..", "reference-calculator", "public", "regulation-vanilla-v1.17.js");
const data = JSON.parse(readFileSync(file, "utf8"));

// 1. each weaponType number, with example weapons (standard affinity only)
const examples = new Map<number, string[]>();
for (const w of data.weapons) {
  const list = examples.get(w.weaponType) ?? [];
  if (list.length < 3) list.push(`${w.name} (affinity ${w.affinityId})`);
  examples.set(w.weaponType, list);
}
console.log("weaponType -> examples");
for (const [id, names] of [...examples].sort((a, b) => a[0] - b[0])) {
  console.log(id, "->", names.join(", "));
}
// 2. how many weapons need the features we're adding
const paired = data.weapons.filter((w: any) => w.paired);
console.log("paired weapons:", paired.length, paired.slice(0, 5).map((w: any) => w.name));

const partialNames = new Set<string>();
for (const w of data.weapons) {
  const correct = data.attackElementCorrects[w.attackElementCorrectId];
  for (const id of [0, 1, 2, 3, 4]) {
    for (const v of Object.values(correct?.[id] ?? {})) {
      if (v !== true) partialNames.add(w.name);
    }
  }
}
console.log("weapons with partial scaling:", partialNames.size, [...partialNames].slice(0, 5));
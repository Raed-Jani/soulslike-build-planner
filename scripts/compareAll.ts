import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { calculateAR, calculateARDetail } from "../src/calculateAR";
import { makeBuilder, STATUS_IDS } from "../src/engine/buildWeapon";
import { allStatusTypes } from "../src/weapon";
import { decodeRegulationData } from "../../reference-calculator/src/regulationData";
import getWeaponAttack from "../../reference-calculator/src/calculator/calculator";

const file = resolve("public", "data", "regulation-vanilla-v1.17.json");
const data = JSON.parse(readFileSync(file, "utf8"));
const build = makeBuilder(data);
const theirWeapons = decodeRegulationData(data); // same order as data.weapons

const STATS = ["str", "dex", "int", "fai", "arc"];
const statSets: Record<string, number>[] = [
  { str: 5, dex: 5, int: 5, fai: 5, arc: 5 },
  { str: 99, dex: 99, int: 99, fai: 99, arc: 99 },
  ...STATS.map((s) => ({ str: 12, dex: 12, int: 12, fai: 12, arc: 12, [s]: 60 })),
];
const TYPES = ["physical", "magic", "fire", "lightning", "holy"] as const;

let checks = 0;
const failures = new Map<string, string>(); // weapon name -> first mismatch
const failuresByType = new Map<number, number>(); // weaponType -> number of weapons
const mismatchesByKind = new Map<string, number>(); // damage / status / spell -> comparisons

function check(raw: any, kind: string, label: string, mine: number, theirs: number, context: string) {
  checks++;
  if (Math.abs(mine - theirs) <= 1e-6) return;
  mismatchesByKind.set(kind, (mismatchesByKind.get(kind) ?? 0) + 1);
  if (!failures.has(raw.name)) {
    failures.set(raw.name, `${kind} ${label} ${context}: mine ${mine} theirs ${theirs}`);
    failuresByType.set(raw.weaponType, (failuresByType.get(raw.weaponType) ?? 0) + 1);
  }
}

data.weapons.forEach((raw: any, i: number) => {
  const mine = build(raw);
  const theirs = theirWeapons[i];
  const maxLevel = mine.attack.length - 1;
  const isTool = Boolean(mine.sorceryTool || mine.incantationTool);

  for (const level of new Set([0, Math.floor(maxLevel / 2), maxLevel])) {
    for (const stats of statSets) {
      for (const twoHanding of [false, true]) {
        const full: any = getWeaponAttack({
          weapon: theirs,
          attributes: stats as any,
          twoHanding,
          upgradeLevel: level,
        });
        const attackPower: any = full.attackPower;
        const context = `lvl ${level} stats ${JSON.stringify(stats)} twoHanded=${twoHanding}`;

        const character = { vig: 20, mnd: 10, end: 20, ...stats } as any;
        const damage: any = calculateAR(mine, character, level, twoHanding);
        const detail = calculateARDetail(mine, character, level, twoHanding);

        // damage per type
        TYPES.forEach((type, id) => {
          check(raw, "damage", type, damage[type] ?? 0, attackPower[id] ?? 0, context);
        });

        // status buildup
        allStatusTypes.forEach((type) => {
          check(
            raw, "status", type,
            detail.status[type]?.total ?? 0,
            attackPower[STATUS_IDS[type]] ?? 0,
            context
          );
        });

        // spell scaling of staves and seals (100 = no bonus)
        if (isTool) {
          TYPES.forEach((type, id) => {
            check(
              raw, "spell", type,
              detail.spell[type]?.scaling ?? 100,
              full.spellScaling[id] ?? 100,
              context
            );
          });
        }
      }
    }
  }
});

console.log(`${data.weapons.length} weapons, ${checks} comparisons`);
console.log(`weapons with a mismatch: ${failures.size}`);
console.log("mismatching comparisons per kind:", [...mismatchesByKind]);
console.log("mismatching weapons per weaponType:", [...failuresByType]);
[...failures].slice(0, 25).forEach(([name, why]) => console.log(" ", name, "->", why));
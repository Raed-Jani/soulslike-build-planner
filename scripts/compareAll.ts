import { calculateAR, calculateARDetail } from "../src/calculateAR";
import { makeBuilder, STATUS_IDS } from "../src/engine/buildWeapon";
import { allStatusTypes } from "../src/weapon";


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

data.weapons.forEach((raw: any, i: number) => {
  const mine = build(raw);
  const theirs = theirWeapons[i];
  const maxLevel = mine.attack.length - 1;

  for (const level of new Set([0, Math.floor(maxLevel / 2), maxLevel])) {
    for (const stats of statSets) {
      for (const twoHanding of [false, true]) {
        const a: any = calculateAR(mine as any, { vig: 20, mnd: 10, end: 20, ...stats } as any, level, twoHanding);
        const b: any = getWeaponAttack({
          weapon: theirs,
          attributes: stats as any,
          twoHanding,
          upgradeLevel: level,
        }).attackPower;

        TYPES.forEach((type, id) => {
          const detail = calculateARDetail(mine as any, { vig: 20, mnd: 10, end: 20, ...stats } as any, level, twoHanding);
allStatusTypes.forEach((type) => {
  checks++;
  const x = detail.status[type]?.total ?? 0;
  const y = b[STATUS_IDS[type]] ?? 0;
  if (Math.abs(x - y) > 1e-6 && !failures.has(raw.name)) {
    failures.set(raw.name, `status ${type} lvl ${level} stats ${JSON.stringify(stats)} twoHanded=${twoHanding}: mine ${x} theirs ${y}`);
    failuresByType.set(raw.weaponType, (failuresByType.get(raw.weaponType) ?? 0) + 1);
  }
});
          checks++;
          const x = a[type] ?? 0;
          const y = b[id] ?? 0;
          if (Math.abs(x - y) > 1e-6 && !failures.has(raw.name)) {
            failures.set(
              raw.name,
              `${type} lvl ${level} stats ${JSON.stringify(stats)} twoHanded=${twoHanding}: mine ${x} theirs ${y}`
            );
            failuresByType.set(raw.weaponType, (failuresByType.get(raw.weaponType) ?? 0) + 1);¨
            
          }
        });
      }
    }
  }
});

console.log(`${data.weapons.length} weapons, ${checks} comparisons`);
console.log(`weapons with a mismatch: ${failures.size}`);
console.log("mismatching weapons per weaponType:", [...failuresByType]);
[...failures].slice(0, 25).forEach(([name, why]) => console.log(" ", name, "->", why));
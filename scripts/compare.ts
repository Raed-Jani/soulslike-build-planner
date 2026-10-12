import { calculateAR } from "../src/calculateAR";
import { weapons } from "../src/data/weapons";

const base = { vig: 20, mnd: 10, end: 20, str: 18, dex: 18, int: 10, fai: 10, arc: 10 };

const cases = [
  { label: "A: Uchigatana +25, Str 30 Dex 40", weapon: "Uchigatana", stats: { ...base, str: 30, dex: 40 }, level: 25, twoHanding: false },
  { label: "B: Uchigatana +0 two-handed, Str 18 Dex 18", weapon: "Uchigatana", stats: base, level: 0, twoHanding: true },
  { label: "C: Moonveil +10, Str 12 Dex 24 Int 40", weapon: "Moonveil", stats: { ...base, str: 12, dex: 24, int: 40 }, level: 10, twoHanding: false },
];

for (const c of cases) {
  const weapon = weapons.find((w) => w.name === c.weapon)!;
  const result = calculateAR(weapon, c.stats, c.level, c.twoHanding);
  console.log(c.label);
  for (const [type, value] of Object.entries(result)) {
    console.log(`  ${type}: ${value!.toFixed(2)} (floored: ${Math.floor(value!)})`);
  }
}
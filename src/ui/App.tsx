import { useState } from "react";
import { calculateAR, totalAR } from "../calculateAR";
import { weapons } from "../data/weapons";
import { allDamageTypes } from "../weapon";
import type { Attributes } from "../attributes";

const STAT_FIELDS = ["str", "dex", "int", "fai", "arc"] as const;

export default function App() {
  const [weaponName, setWeaponName] = useState(weapons[0].name);
  const [level, setLevel] = useState(0);
  const [twoHanding, setTwoHanding] = useState(false);
  const [stats, setStats] = useState<Attributes>({
    vig: 20, mnd: 10, end: 20, str: 18, dex: 18, int: 10, fai: 10, arc: 10,
  });

  // derived values: computed from the state above, not stored as state
  const weapon = weapons.find((w) => w.name === weaponName)!;
  const maxLevel = weapon.attack.length - 1;
  const safeLevel = Math.min(level, maxLevel);
  const result = calculateAR(weapon, stats, safeLevel, twoHanding);

  function setStat(stat: (typeof STAT_FIELDS)[number], value: string) {
    const n = Math.min(99, Math.max(1, Number(value) || 1));
    setStats({ ...stats, [stat]: n });
  }

  return (
    <main style={{ maxWidth: 480, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>Soulslike Build Planner</h1>

      <label>
        Weapon{" "}
        <select value={weaponName} onChange={(e) => setWeaponName(e.target.value)}>
          {weapons.map((w) => (
            <option key={w.name} value={w.name}>{w.name}</option>
          ))}
        </select>
      </label>

      <p>
        <label>
          Level{" "}
          <select value={safeLevel} onChange={(e) => setLevel(Number(e.target.value))}>
            {Array.from({ length: maxLevel + 1 }, (_, i) => (
              <option key={i} value={i}>+{i}</option>
            ))}
          </select>
        </label>{" "}
        <label>
          <input
            type="checkbox"
            checked={twoHanding}
            onChange={(e) => setTwoHanding(e.target.checked)}
          />{" "}
          Two-handing
        </label>
      </p>

      <p>
        {STAT_FIELDS.map((stat) => (
          <label key={stat} style={{ marginRight: 12 }}>
            {stat.toUpperCase()}{" "}
            <input
              type="number"
              min={1}
              max={99}
              value={stats[stat]}
              onChange={(e) => setStat(stat, e.target.value)}
              style={{ width: 52 }}
            />
          </label>
        ))}
      </p>

      <h2>Attack rating</h2>
      <ul>
        {allDamageTypes.map((type) =>
          result[type] === undefined ? null : (
            <li key={type}>{type}: {result[type]!.toFixed(1)}</li>
          )
        )}
      </ul>
      <strong>Total: {totalAR(result).toFixed(1)}</strong>
    </main>
  );
}
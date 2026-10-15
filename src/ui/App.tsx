import { useEffect, useMemo, useState } from "react";
import { adjustForTwoHanding, ALWAYS_TWO_HANDED, calculateAR } from "../calculateAR";
import { makeBuilder } from "../engine/buildWeapon";
import { allDamageTypes, type Weapon } from "../weapon";
import type { Attributes } from "../attributes";
import { loadRegulation } from "./loadRegulation";

const STAT_FIELDS = ["str", "dex", "int", "fai", "arc"] as const;

// staves (57), seals (61) and torches (87): their value is spell scaling, which v1 doesn't model
const HIDDEN_TYPES = [57, 61, 87];
type StatField = (typeof STAT_FIELDS)[number];

// text -> a valid stat (1 to 99); empty or invalid text counts as 1
function parseStat(text: string): number {
  const n = Math.floor(Number(text));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(99, n);
}
export default function App() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number | null>(null); // index into data.weapons
  const [level, setLevel] = useState(0);
  const [twoHanding, setTwoHanding] = useState(false);
  const [statText, setStatText] = useState<Record<StatField, string>>({
  str: "18", dex: "18", int: "10", fai: "10", arc: "10",
});
const stats: Attributes = {
  vig: 20, mnd: 10, end: 20,
  str: parseStat(statText.str),
  dex: parseStat(statText.dex),
  int: parseStat(statText.int),
  fai: parseStat(statText.fai),
  arc: parseStat(statText.arc),
};

  // load the data once, when the page opens
  useEffect(() => {
    loadRegulation()
      .then(setData)
      .catch((e) => setError(String(e.message ?? e)));
  }, []);

  const build = useMemo(() => (data ? makeBuilder(data) : null), [data]);

  // first 50 weapons whose name contains the search text
  const matches = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const found: { index: number; name: string }[] = [];
    for (let i = 0; i < data.weapons.length && found.length < 50; i++) {
      const w = data.weapons[i];
      if (HIDDEN_TYPES.includes(w.weaponType)) continue;
      if (q === "" || w.name.toLowerCase().includes(q)) found.push({ index: i, name: w.name });
    }
    return found;
  }, [data, query]);

  // the selected weapon, built on demand
  const weapon = useMemo<Weapon | null>(() => {
  if (!data || !build || selected === null) return null;
  return build(data.weapons[selected]);
  }, [data, build, selected]);

  if (error) return <p>Something went wrong: {error}</p>;
  if (!data) return <p>Loading weapon data...</p>;

  // values derived from the selected weapon and the inputs
  let details = null;
  if (weapon) {
    const maxLevel = weapon.attack.length - 1;
    const safeLevel = Math.min(level, maxLevel);
    const alwaysTwoHanded =
      weapon.weaponType !== undefined && ALWAYS_TWO_HANDED.includes(weapon.weaponType);
    const effective = adjustForTwoHanding(weapon, stats, twoHanding);
    const unmet = Object.entries(weapon.requirements).filter(
      ([stat, req]) => effective[stat as keyof Attributes] < (req ?? 0)
    );

    const result = calculateAR(weapon, stats, safeLevel, twoHanding);
    // like the game: round each damage type down, then add them up
    const rows = allDamageTypes
      .filter((type) => result[type] !== undefined)
      .map((type) => [type, Math.floor(result[type]!)] as const);
    const total = rows.reduce((sum, [, value]) => sum + value, 0);

    details = (
      <>
        <h2>{weapon.name}</h2>
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
              checked={alwaysTwoHanded || twoHanding}
              disabled={alwaysTwoHanded || weapon.paired}
              onChange={(e) => setTwoHanding(e.target.checked)}
            />{" "}
            Two-handing
            {alwaysTwoHanded && " (always)"}
            {weapon.paired && " (no bonus for paired weapons)"}
          </label>
        </p>

        <p>
          {STAT_FIELDS.map((stat) => (
            <label key={stat} style={{ marginRight: 12 }}>
              {stat.toUpperCase()}{" "}
              <input
                type="text"
                inputMode="numeric"
                value={statText[stat]}
                onChange={(e) =>
                  setStatText({ ...statText, [stat]: e.target.value.replace(/\D/g, "").slice(0, 2) })
                }
                onBlur={() => setStatText({ ...statText, [stat]: String(parseStat(statText[stat])) })}
                style={{ width: 52 }}
              />
            </label>
          ))}
        </p>

        {unmet.length > 0 && (
          <p>
            Requirement not met: {unmet.map(([stat, req]) => `${stat.toUpperCase()} ${req}`).join(", ")}
            . Damage is reduced for the types that scale with it.
          </p>
        )}

        <h3>Attack rating</h3>
        <ul>
          {rows.map(([type, value]) => (
            <li key={type}>{type}: {value}</li>
          ))}
        </ul>
        <strong>Total: {total}</strong>
      </>
    );
  }

  return (
    <main style={{ maxWidth: 520, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>Soulslike Build Planner</h1>

      <input
        type="search"
        placeholder="Search weapons..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: "100%", padding: 6 }}
      />
      <ul style={{ maxHeight: 200, overflowY: "auto", paddingLeft: 16 }}>
        {matches.map((m) => (
          <li key={m.index}>
            <button
              onClick={() => setSelected(m.index)}
              style={{ fontWeight: m.index === selected ? "bold" : "normal" }}
            >
              {m.name}
            </button>
          </li>
        ))}
        {matches.length === 0 && <li>No weapons match.</li>}
      </ul>

      {details ?? <p>Pick a weapon to see its attack rating.</p>}
    </main>
  );
}
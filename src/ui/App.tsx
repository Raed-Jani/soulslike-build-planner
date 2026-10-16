import { useEffect, useMemo, useState } from "react";
import type { ScalingTiers } from "../calculateAR";
import { makeBuilder } from "../engine/buildWeapon";
import type { Attributes } from "../attributes";
import type { Weapon } from "../weapon";
import { loadRegulation } from "./loadRegulation";
import { parseStat, type StatField, type StatText } from "./stats";
import StatsForm from "./components/StatsForm";
import WeaponCard from "./components/WeaponCard";
import WeaponPicker from "./components/WeaponPicker";

// staves (57), seals (61) and torches (87): their value is spell scaling, which v1 doesn't model
const HIDDEN_TYPES = [57, 61, 87];

export default function App() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number | null>(null); // index into data.weapons
  const [level, setLevel] = useState(0);
  const [twoHanding, setTwoHanding] = useState(false);
  const [statText, setStatText] = useState<StatText>({
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

  function changeStat(stat: StatField, text: string) {
    setStatText({ ...statText, [stat]: text });
  }

  if (error) return <p>Something went wrong: {error}</p>;
  if (!data) return <p>Loading weapon data...</p>;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Soulslike Build Planner</h1>
      </header>

      <main className="layout">
        <aside className="inputs">
          <WeaponPicker
            query={query}
            onQueryChange={setQuery}
            matches={matches}
            selected={selected}
            onSelect={setSelected}
          />
          <StatsForm statText={statText} onChange={changeStat} />
        </aside>

        <section className="output">
          {weapon ? (
            <WeaponCard
              weapon={weapon}
              stats={stats}
              tiers={data.scalingTiers as ScalingTiers}
              level={level}
              onLevelChange={setLevel}
              twoHanding={twoHanding}
              onTwoHandingChange={setTwoHanding}
            />
          ) : (
            <p className="empty">Pick a weapon to see its attack rating.</p>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <p>
          Fan-made, non-commercial project, not affiliated with FromSoftware or Bandai Namco. Weapon
          data and the scaling-curve code come from{" "}
          <a href="https://github.com/ThomasJClark/elden-ring-weapon-calculator">
            elden-ring-weapon-calculator
          </a>{" "}
          (MIT). Game data belongs to FromSoftware / Bandai Namco.{" "}
          <a href="https://github.com/Raed-Jani/soulslike-build-planner">Source code</a>
        </p>
      </footer>
    </div>
  );
}
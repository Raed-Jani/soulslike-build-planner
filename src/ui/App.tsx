import { useEffect, useMemo, useState } from "react";
import type { ScalingTiers } from "../calculateAR";
import type { Attributes } from "../attributes";
import { makeBuilder } from "../engine/buildWeapon";
import { affinityKeyOf, type AffinityKey } from "./affinities";
import { loadRegulation } from "./loadRegulation";
import { parseStat, type StatField, type StatText } from "./stats";
import AffinityFilter from "./components/AffinityFilter";
import StatsForm from "./components/StatsForm";
import WeaponCard from "./components/WeaponCard";
import WeaponPicker from "./components/WeaponPicker";
import WeaponTypeFilter from "./components/WeaponTypeFilter";
import Header from "./components/Header";

const REPO = "https://github.com/Raed-Jani/soulslike-build-planner";
const DATA_VERSION = "1.17";

export default function App() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [affinities, setAffinities] = useState<Set<AffinityKey>>(new Set(["standard", "unique"]));
  const [picked, setPicked] = useState<number[]>([]); // indexes into data.weapons
  const [levels, setLevels] = useState<Record<number, number>>({});
  const [twoHandings, setTwoHandings] = useState<Record<number, boolean>>({});
  const [types, setTypes] = useState<Set<number>>(new Set()); // empty = every type
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

  useEffect(() => {
    loadRegulation()
      .then(setData)
      .catch((e) => setError(String(e.message ?? e)));
  }, []);

  const build = useMemo(() => (data ? makeBuilder(data) : null), [data]);

  // the first 50 weapons matching the search text, the type filter and the ticked affinities
const matches = useMemo(() => {
  const list: { index: number; name: string; affinity: AffinityKey }[] = [];
  let total = 0;
  if (!data) return { list, total };
  const q = query.trim().toLowerCase();
  for (let i = 0; i < data.weapons.length; i++) {
    const w = data.weapons[i];
    if (types.size > 0 && !types.has(w.weaponType)) continue;
    const key = affinityKeyOf(w.affinityId);
    if (!key || !affinities.has(key)) continue;
    if (q !== "" && !w.name.toLowerCase().includes(q)) continue;
    total++;
    if (list.length < 50) list.push({ index: i, name: w.name, affinity: key });
  }
  return { list, total };
}, [data, query, affinities, types]);

// how many weapons each type has with the current affinity filter
const typeCounts = useMemo(() => {
  const counts: Record<number, number> = {};
  if (!data) return counts;
  for (const w of data.weapons) {
    const key = affinityKeyOf(w.affinityId);
    if (!key || !affinities.has(key)) continue;
    counts[w.weaponType] = (counts[w.weaponType] ?? 0) + 1;
  }
  return counts;
}, [data, affinities]);

  // the picked weapons, built once per change of selection
  const built = useMemo(() => {
    if (!data || !build) return [];
    return picked.map((index) => ({
      index,
      weapon: build(data.weapons[index]),
      affinity: affinityKeyOf(data.weapons[index].affinityId),
    }));
  }, [data, build, picked]);

  function togglePick(index: number) {
    if (picked.includes(index)) {
      setPicked(picked.filter((i) => i !== index));
      return;
    }
    // new weapons start at their maximum level, like the reference calculator
    const maxLevel = data.reinforceTypes[data.weapons[index].reinforceTypeId].length - 1;
    setPicked([...picked, index]);
    setLevels({ ...levels, [index]: maxLevel });
  }

  function toggleAffinity(key: AffinityKey) {
    const next = new Set(affinities);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setAffinities(next);
  }

  function toggleType(id: number) {
  const next = new Set(types);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  setTypes(next);
}

function toggleGroup(ids: number[]) {
  const next = new Set(types);
  const allChosen = ids.every((id) => next.has(id));
  for (const id of ids) {
    if (allChosen) next.delete(id);
    else next.add(id);
  }
  setTypes(next);
}

  function changeStat(stat: StatField, text: string) {
    setStatText({ ...statText, [stat]: text });
  }

  if (error) return <p>Something went wrong: {error}</p>;
  if (!data) return <p>Loading weapon data...</p>;

  return (
    <div className="app">
      <Header repo={REPO} dataVersion={DATA_VERSION} />
      <main className="layout">
        <aside className="inputs">
          <WeaponPicker
            query={query}
            onQueryChange={setQuery}
            matches={matches.list}
            total={matches.total}
            chosen={built.map(({ index, weapon, affinity }) => ({ index, name: weapon.name, affinity }))}
            onToggle={togglePick}
          >
            <WeaponTypeFilter
              selected={types}
              counts={typeCounts}
              onToggleType={toggleType}
              onToggleGroup={toggleGroup}
              onClear={() => setTypes(new Set())}
            />
          </WeaponPicker>
          <AffinityFilter selected={affinities} onToggle={toggleAffinity} />
        </aside>

        <section className="output">
          <StatsForm statText={statText} onChange={changeStat} />
          {built.length === 0 ? (
            <p className="empty">Pick one or more weapons to see their attack rating.</p>
          ) : (
            <div className="cards">
              {built.map(({ index, weapon, affinity }) => (
                <WeaponCard
                  key={index}
                  weapon={weapon}
                  affinity={affinity}
                  stats={stats}
                  tiers={data.scalingTiers as ScalingTiers}
                  level={levels[index] ?? 0}
                  onLevelChange={(level) => setLevels({ ...levels, [index]: level })}
                  twoHanding={twoHandings[index] ?? false}
                  onTwoHandingChange={(value) => setTwoHandings({ ...twoHandings, [index]: value })}
                  onRemove={() => setPicked(picked.filter((i) => i !== index))}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      <footer className="app-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <strong>Elden Ring Damage Calculator</strong>
          <p>
            A free, open-source attack rating calculator. It runs entirely in your browser, and
            nothing is sent anywhere.
          </p>
          <p className="footer-stack">Built with TypeScript, React and Vite.</p>
        </div>
        <nav aria-label="Project">
          <h3>Project</h3>
          <ul>
            <li><a href={REPO}>Source code</a></li>
            <li><a href={`${REPO}/issues`}>Report an issue</a></li>
            <li><a href={`${REPO}/blob/main/LICENSE`}>MIT license</a></li>
          </ul>
        </nav>
        <nav aria-label="Credits">
          <h3>Credits and data</h3>
          <ul>
            <li>
              Weapon data:{" "}
              <a href="https://github.com/ThomasJClark/elden-ring-weapon-calculator">
                elden-ring-weapon-calculator
              </a>{" "}
              by Tom Clark (MIT)
            </li>
            <li>Data version: patch {DATA_VERSION}</li>
          </ul>
        </nav>
      </div>
      <div className="footer-legal">
        <p>
          © 2026 <a href="https://github.com/Raed-Jani">Raed Jani</a>
        </p>
        <p>
          Fan-made, non-commercial project. Not affiliated with or endorsed by FromSoftware or Bandai
          Namco. ELDEN RING, its game data, names and icons belong to FromSoftware / Bandai Namco.
        </p>
      </div>
    </footer>
    </div>
  );
}
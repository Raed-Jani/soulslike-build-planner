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

// staves (57), seals (61) and torches (87): their value is spell scaling, which v1 doesn't model
const HIDDEN_TYPES = [57, 61, 87];
const REPO = "https://github.com/Raed-Jani/soulslike-build-planner";

export default function App() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [affinities, setAffinities] = useState<Set<AffinityKey>>(new Set(["standard", "unique"]));
  const [picked, setPicked] = useState<number[]>([]); // indexes into data.weapons
  const [levels, setLevels] = useState<Record<number, number>>({});
  const [twoHandings, setTwoHandings] = useState<Record<number, boolean>>({});
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

  // first 50 weapons matching the search text and the ticked affinities
  const matches = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const found: { index: number; name: string; affinity: AffinityKey }[] = [];
    for (let i = 0; i < data.weapons.length && found.length < 50; i++) {
      const w = data.weapons[i];
      if (HIDDEN_TYPES.includes(w.weaponType)) continue;
      const key = affinityKeyOf(w.affinityId);
      if (!key || !affinities.has(key)) continue;
      if (q === "" || w.name.toLowerCase().includes(q)) {
        found.push({ index: i, name: w.name, affinity: key });
      }
    }
    return found;
  }, [data, query, affinities]);

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

  function changeStat(stat: StatField, text: string) {
    setStatText({ ...statText, [stat]: text });
  }

  if (error) return <p>Something went wrong: {error}</p>;
  if (!data) return <p>Loading weapon data...</p>;

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Elden Ring Damage Calculator</h1>
          <p className="subtitle">Attack rating by weapon, upgrade level and attributes</p>
        </div>
        <a className="github-link" href={REPO} aria-label="Source code on GitHub" title="Source code on GitHub">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
        </a>
      </header>

      <main className="layout">
        <aside className="inputs">
          <WeaponPicker
            query={query}
            onQueryChange={setQuery}
            matches={matches}
            picked={picked}
            onToggle={togglePick}
          />
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
        <div className="footer-main">
          <div className="footer-brand">
            <strong>Elden Ring Damage Calculator</strong>
            <p>
              A free, open-source attack rating calculator. Everything runs in your browser and
              nothing is sent anywhere.
            </p>
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
            <h3>Credits</h3>
            <ul>
              <li>
                <a href="https://github.com/ThomasJClark/elden-ring-weapon-calculator">
                  elden-ring-weapon-calculator
                </a>{" "}
                by Tom Clark: weapon data and curve code (MIT)
              </li>
              <li>Data version: patch 1.17</li>
            </ul>
          </nav>
        </div>
        <div className="footer-legal">
          <p>
            © 2026 <a href="https://github.com/Raed-Jani">Raed Jani</a>. Released under the MIT
            license.
          </p>
          <p>
            Fan-made, non-commercial project, not affiliated with or endorsed by FromSoftware or
            Bandai Namco. ELDEN RING, its weapon data, names and icons belong to FromSoftware /
            Bandai Namco.
          </p>
        </div>
      </footer>
    </div>
  );
}
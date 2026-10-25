import { useEffect, useMemo, useRef, useState } from "react";
import type { ScalingTiers } from "../calculateAR";
import type { RegulationData } from "../regulationData";
import { makeBuilder } from "../engine/buildWeapon";
import { affinityInfo, affinityKeyOf, type AffinityKey } from "./affinities";
import { loadRegulation } from "./loadRegulation";
import { type StatField, type StatText } from "./stats";
import AffinityFilter from "./components/AffinityFilter";
import LoadingError from "./components/LoadingError";
import StatsForm from "./components/StatsForm";
import WeaponCard from "./components/WeaponCard";
import WeaponPicker from "./components/WeaponPicker";
import WeaponTypeFilter from "./components/WeaponTypeFilter";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { DATA_VERSION, decodeComparison, encodeComparison } from "./shareComparison";
import ShareComparison from "./components/ShareComparison";
import { createDistributionPair, distributionAttributes, normalizeStatText, updateComparisonBaselines, type DistributionPair } from "./statDistributions";

const REPO = "https://github.com/Raed-Jani/soulslike-build-planner";

export default function App() {
  const [data, setData] = useState<RegulationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [query, setQuery] = useState("");
  const [affinities, setAffinities] = useState<Set<AffinityKey>>(new Set(["standard", "unique"]));
  const [picked, setPicked] = useState<number[]>([]); // indexes into data.weapons
  const [levels, setLevels] = useState<Record<number, number>>({});
  const [twoHandings, setTwoHandings] = useState<Record<number, boolean>>({});
  const [distributions, setDistributions] = useState<Record<number, DistributionPair>>({});
  const [types, setTypes] = useState<Set<number>>(new Set()); // empty = every type
  const [linkNotice, setLinkNotice] = useState("");
  const [browserOpen, setBrowserOpen] = useState(true);
  const outputRef = useRef<HTMLElement>(null);
  const [statText, setStatText] = useState<StatText>({
    str: "18", dex: "18", int: "10", fai: "10", arc: "10",
  });

  const stats = distributionAttributes(statText);

  useEffect(() => {
    setError(null);
    setData(null);
    loadRegulation()
      .then(setData)
      .catch((e) => setError(String(e.message ?? e)));
  }, [retryKey]);

  const build = useMemo(() => (data ? makeBuilder(data) : null), [data]);
  const rawVariantsByName = useMemo(() => {
    const groups = new Map<string, RegulationData["weapons"]>();
    for (const raw of data?.weapons ?? []) {
      const group = groups.get(raw.weaponName) ?? [];
      group.push(raw);
      groups.set(raw.weaponName, group);
    }
    return groups;
  }, [data]);

  useEffect(() => {
    if (!data) return;
    function restoreComparison() {
      try {
        const restored = decodeComparison(window.location.hash, data!);
        if (!restored) { setLinkNotice(""); return; }
        setStatText(restored.state.statText);
        setPicked(restored.state.picked);
        setLevels(restored.state.levels);
        setTwoHandings(restored.state.twoHandings);
        setDistributions(restored.state.distributions ?? {});
        setBrowserOpen(false);
        setLinkNotice(restored.warnings.join(" ") || "Shared comparison loaded.");
      } catch (error) {
        setLinkNotice(error instanceof Error ? error.message : "Could not load this comparison link.");
      }
    }
    restoreComparison();
    window.addEventListener("hashchange", restoreComparison);
    return () => window.removeEventListener("hashchange", restoreComparison);
  }, [data]);

  // Match the dataset here; the picker progressively displays batches of 50.
const matches = useMemo(() => {
  const list: { index: number; name: string; affinity: AffinityKey; dlc: boolean }[] = [];
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
    list.push({ index: i, name: w.name, affinity: key, dlc: w.dlc ?? false });
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
      variants: (rawVariantsByName.get(data.weapons[index].weaponName) ?? []).map((raw) => ({
        affinityId: raw.affinityId,
        label: affinityInfo(affinityKeyOf(raw.affinityId))?.label ?? String(raw.affinityId),
        weapon: build(raw),
      })),
    }));
  }, [data, build, picked, rawVariantsByName]);

  function togglePick(index: number) {
    if (picked.includes(index)) {
      setPicked(picked.filter((i) => i !== index));
      setDistributions((current) => {
        const next = { ...current };
        delete next[index];
        return next;
      });
      return;
    }
    if (!data) return;
    // new weapons start at their maximum level, like the reference calculator
    const maxLevel = data.reinforceTypes[data.weapons[index].reinforceTypeId].length - 1;
    setBrowserOpen(true);
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
    if (statText[stat] === text) return;
    setStatText((current) => ({ ...current, [stat]: text }));
    setDistributions((current) => updateComparisonBaselines(current, stat, text));
  }

  if (error)
    return (
      <LoadingError
        message={error}
        onRetry={() => setRetryKey((k) => k + 1)}
      />
    );
  if (!data)
    return <p className="loading-screen">Loading weapon data…</p>;

  return (
    <div className="app">
      <Header repo={REPO} dataVersion={DATA_VERSION} />
      <main className="layout">
        <aside className="inputs" aria-label="Weapon browser" tabIndex={0}>
          <button
            type="button"
            className="mobile-browser-toggle"
            aria-expanded={browserOpen}
            aria-controls="weapon-browser"
            onClick={() => setBrowserOpen(!browserOpen)}
          >
            <span>{browserOpen ? "Choose weapons" : "Add or change weapons"}</span>
            <span className="selection-count">{picked.length} selected</span>
            <span aria-hidden="true">{browserOpen ? "−" : "+"}</span>
          </button>
          <div id="weapon-browser" className={`weapon-browser-content${browserOpen ? " is-open" : ""}`}>
          <WeaponPicker
            query={query}
            onQueryChange={setQuery}
            matches={matches.list}
            total={matches.total}
            chosen={built.map(({ index, weapon, affinity }) => ({ index, name: weapon.name, affinity, dlc: weapon.dlc }))}
            onToggle={togglePick}
            typeCount={types.size}
            affinityCount={affinities.size}
            typeFilter={<WeaponTypeFilter
              selected={types}
              counts={typeCounts}
              onToggleType={toggleType}
              onToggleGroup={toggleGroup}
              onClear={() => setTypes(new Set())}
            />}
            affinityFilter={<AffinityFilter selected={affinities} onToggle={toggleAffinity} />}
          />
          {picked.length > 0 && (
            <button type="button" className="mobile-view-results" onClick={() => {
              setBrowserOpen(false);
              outputRef.current?.focus({ preventScroll: true });
              outputRef.current?.scrollIntoView({ block: "start" });
            }}>
              View comparison ({picked.length}) <span aria-hidden="true">↓</span>
            </button>
          )}
          </div>
        </aside>

        <section className="output" ref={outputRef} tabIndex={-1} aria-label="Weapon comparison">
          <StatsForm statText={statText} onChange={changeStat} />
          {picked.some((index) => distributions[index]) && <p className="comparison-note">The attribute bar updates Configuration A in open comparisons. B stays independent; you can also edit either configuration below.</p>}
          <ShareComparison
            // Reset the generated link and clipboard message when the comparison
            // changes. Search/filter edits do not change the shared comparison.
            key={JSON.stringify([statText, picked.map((index) => [index, levels[index] ?? 0, twoHandings[index] ?? false, distributions[index]])])}
            createLink={() => {
            const url = new URL(window.location.href);
            // Share the same normalized attributes that the calculator currently uses.
            const normalized = normalizeStatText(statText);
            const normalizedDistributions = Object.fromEntries(picked.filter((index) => distributions[index]).map((index) => [index, {
              a: { ...distributions[index].a, statText: normalizeStatText(distributions[index].a.statText) },
              b: { ...distributions[index].b, statText: normalizeStatText(distributions[index].b.statText) },
            }]));
            url.hash = encodeComparison({ statText: normalized, picked, levels, twoHandings, distributions: normalizedDistributions }, data);
            window.history.replaceState(null, "", url);
            return url.href;
          }} />
          {linkNotice && <p className="share-notice" role="status">{linkNotice}</p>}
          {built.length === 0 ? (
            <p className="empty">Pick one or more weapons to see their attack rating.</p>
          ) : (
            <div className="cards">
              {built.map(({ index, weapon, affinity, variants }) => (
                <WeaponCard
                  key={index}
                  weapon={weapon}
                  variants={variants}
                  affinity={affinity}
                  stats={distributions[index] ? distributionAttributes(distributions[index].a.statText) : stats}
                  distributionPair={distributions[index]}
                  onStartComparison={() => setDistributions((current) => ({ ...current, [index]: createDistributionPair(statText, levels[index] ?? 0, twoHandings[index] ?? false, data.weapons[index].affinityId) }))}
                  onDistributionChange={(pair) => setDistributions((current) => ({ ...current, [index]: pair }))}
                  onCloseComparison={() => setDistributions((current) => {
                    const next = { ...current };
                    delete next[index];
                    return next;
                  })}
                  tiers={data.scalingTiers as ScalingTiers}
                  level={levels[index] ?? 0}
                  onLevelChange={(level) => setLevels({ ...levels, [index]: level })}
                  twoHanding={twoHandings[index] ?? false}
                  onTwoHandingChange={(value) => setTwoHandings({ ...twoHandings, [index]: value })}
                  onRemove={() => togglePick(index)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer repo={REPO} dataVersion={DATA_VERSION} />
    </div>
  );
}

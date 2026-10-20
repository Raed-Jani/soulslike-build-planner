import type { RegulationData } from "../regulationData";

// Fetches the weapon data once and remembers it.
let cache: Promise<RegulationData> | null = null;

export function loadRegulation(): Promise<RegulationData> {
  cache ??= fetch(`${import.meta.env.BASE_URL}data/regulation-vanilla-v1.17.json`)
    .then((r) => {
      if (!r.ok) throw new Error(`Could not load weapon data (${r.status})`);
      return r.json() as Promise<RegulationData>;
    })
    .catch((e) => {
      cache = null; // allow a retry after a failure
      throw e;
    });
  return cache;
}
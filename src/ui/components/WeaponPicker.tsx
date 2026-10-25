import { useId, useState, type ReactNode } from "react";
import { affinityInfo, type AffinityKey } from "../affinities";
import { Icon } from "../icons";

interface Match {
  index: number;
  name: string;
  affinity: AffinityKey;
  dlc?: boolean;
}

interface Chosen {
  index: number;
  name: string;
  affinity?: AffinityKey;
  dlc?: boolean;
}

interface Props {
  query: string;
  onQueryChange: (query: string) => void;
  matches: Match[];
  total: number;
  chosen: Chosen[];
  onToggle: (index: number) => void;
  typeFilter: ReactNode;
  affinityFilter: ReactNode;
  typeCount: number;
  affinityCount: number;
}

export default function WeaponPicker({
  query, onQueryChange, matches, total, chosen, onToggle, typeFilter, affinityFilter, typeCount, affinityCount,
}: Props) {
  const pickedSet = new Set(chosen.map((c) => c.index));
  const [typesOpen, setTypesOpen] = useState(true);
  const [affinitiesOpen, setAffinitiesOpen] = useState(true);
  const [selectedOpen, setSelectedOpen] = useState(true);
  const filterId = useId();
  const [pagination, setPagination] = useState({ matches, limit: 50 });
  // A new search/filter result starts at 50; selecting weapons preserves the batch.
  const visibleLimit = pagination.matches === matches ? pagination.limit : 50;
  const visibleMatches = matches.slice(0, visibleLimit);

  return (
    <section className="weapon-picker">
      <div className="weapon-search-header">
        <h2>Weapons</h2>
        <input
          type="search"
          placeholder="Search weapons..."
          aria-label="Search weapons"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        {chosen.length > 0 && <button type="button" className="weapon-filter-toggle selected-weapons-toggle"
          aria-expanded={selectedOpen} aria-controls={`${filterId}-selected`} onClick={(event) => {
            setSelectedOpen(!selectedOpen);
            if (!selectedOpen && window.matchMedia("(min-width: 901px)").matches) event.currentTarget.closest(".inputs")?.scrollTo({ top: 0 });
          }}>
          <span>Selected ({chosen.length})</span><span className="filter-chevron" aria-hidden="true" />
        </button>}
      {chosen.length > 0 && (
        <div className="chosen" id={`${filterId}-selected`} hidden={!selectedOpen}>
          <ul>
            {chosen.map((c) => {
              const info = affinityInfo(c.affinity);
              return (
                <li key={c.index}>
                  {info && <Icon name={info.icon} size={18} label={info.label} />}
                  <span className="chosen-name" title={c.name}>{c.name}</span>
                  {c.dlc && <span className="dlc-badge">DLC</span>}
                  <button type="button" aria-label={`Remove ${c.name}`} onClick={() => onToggle(c.index)}>
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      </div>
      <div className="weapon-filter-section">
        <button type="button" className="weapon-filter-toggle" aria-expanded={typesOpen} aria-controls={`${filterId}-types`} onClick={() => setTypesOpen(!typesOpen)}>
          <span>Weapon types</span><small>{typeCount ? `${typeCount} selected` : "All types"}</small><span className="filter-chevron" aria-hidden="true" />
        </button>
        <div id={`${filterId}-types`} className="picker-filter-content browser-panel" hidden={!typesOpen}>{typeFilter}</div>
      </div>
      <div className="weapon-filter-section">
        <button type="button" className="weapon-filter-toggle" aria-expanded={affinitiesOpen} aria-controls={`${filterId}-affinities`} onClick={() => setAffinitiesOpen(!affinitiesOpen)}>
          <span>Affinities</span><small>{affinityCount} selected</small><span className="filter-chevron" aria-hidden="true" />
        </button>
        <div id={`${filterId}-affinities`} className="picker-filter-content browser-panel" hidden={!affinitiesOpen}>{affinityFilter}</div>
      </div>

      <p className="weapon-result-count" role="status">Showing {visibleMatches.length} of {total} weapons</p>
      <ul className="weapon-results" aria-label="Matching weapons">
        {visibleMatches.map((m) => {
          const isPicked = pickedSet.has(m.index);
          const info = affinityInfo(m.affinity);
          return (
            <li key={m.index}>
              <button
                type="button"
                className={isPicked ? "selected" : ""}
                aria-pressed={isPicked}
                onClick={() => onToggle(m.index)}
              >
                {info && <Icon name={info.icon} size={20} label={info.label} />}
                <span>{m.name}</span>
                {m.dlc && <span className="dlc-badge">DLC</span>}
                {isPicked && <span className="check" aria-hidden="true">✓</span>}
              </button>
            </li>
          );
        })}
        {matches.length === 0 && <li className="no-match">No weapons match.</li>}
      </ul>
      {total > visibleMatches.length && (
        <button type="button" className="weapon-show-more" onClick={() => setPagination({ matches, limit: visibleLimit + 50 })}>
          Show {Math.min(50, total - visibleMatches.length)} more weapons
        </button>
      )}
    </section>
  );
}

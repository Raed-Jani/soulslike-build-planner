import type { ReactNode } from "react";
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
  children?: ReactNode;
}

export default function WeaponPicker({
  query, onQueryChange, matches, total, chosen, onToggle, children,
}: Props) {
  const pickedSet = new Set(chosen.map((c) => c.index));

  return (
    <section className="weapon-picker">
      <h2>Weapon</h2>

      {chosen.length > 0 && (
        <div className="chosen">
          <h3>Selected ({chosen.length})</h3>
          <ul>
            {chosen.map((c) => {
              const info = affinityInfo(c.affinity);
              return (
                <li key={c.index}>
                  {info && <Icon name={info.icon} size={18} label={info.label} />}
                  <span className="chosen-name">{c.name}</span>
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

      <input
        type="search"
        placeholder="Search weapons..."
        aria-label="Search weapons"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />

      {children}

      <ul className="weapon-results">
        {matches.map((m) => {
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
      {total > matches.length && (
        <p className="hint">Showing {matches.length} of {total}. Refine the search or the filters.</p>
      )}
    </section>
  );
}
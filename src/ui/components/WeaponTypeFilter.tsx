import { useState } from "react";
import { WEAPON_TYPE_GROUPS } from "../weaponTypes";

interface Props {
  selected: Set<number>;
  counts: Record<number, number>;
  onToggleType: (id: number) => void;
  onToggleGroup: (ids: number[]) => void;
  onClear: () => void;
}

export default function WeaponTypeFilter({
  selected, counts, onToggleType, onToggleGroup, onClear,
}: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  return (
    <section className="type-filter" aria-label="Weapon type filters">
      <div className="type-filter-head">
        {selected.size > 0 && (
          <button type="button" className="link-button" onClick={onClear}>
            Clear ({selected.size})
          </button>
        )}
      </div>

      {WEAPON_TYPE_GROUPS.map((group) => {
        // hide types that have no weapons with the current affinity filter
        const types = group.types.filter((t) => (counts[t.id] ?? 0) > 0 || selected.has(t.id));
        if (types.length === 0) return null;

        const ids = types.map((t) => t.id);
        const total = types.reduce((sum, t) => sum + (counts[t.id] ?? 0), 0);
        const allChosen = ids.every((id) => selected.has(id));
        const isOpen = open[group.key] ?? false;

        return (
          <div key={group.key} className="type-group">
            <div className="type-group-head">
              <button
                type="button"
                className="type-toggle"
                aria-expanded={isOpen}
                onClick={() => setOpen({ ...open, [group.key]: !isOpen })}
              >
                <span className="chevron" aria-hidden="true">{isOpen ? "▾" : "▸"}</span>
                <span>{group.label}</span>
                <span className="count">{total}</span>
              </button>
              <button type="button" className="link-button" onClick={() => onToggleGroup(ids)}>
                {allChosen ? "None" : "All"}
              </button>
            </div>

            {isOpen && (
              <ul>
                {types.map((t) => (
                  <li key={t.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={selected.has(t.id)}
                        onChange={() => onToggleType(t.id)}
                      />
                      <span>{t.label}</span>
                      <span className="count">{counts[t.id] ?? 0}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
}

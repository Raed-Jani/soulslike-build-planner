interface Match {
  index: number;
  name: string;
}

interface Props {
  query: string;
  onQueryChange: (query: string) => void;
  matches: Match[];
  selected: number | null;
  onSelect: (index: number) => void;
}

export default function WeaponPicker({ query, onQueryChange, matches, selected, onSelect }: Props) {
  return (
    <section className="weapon-picker">
      <h2>Weapon</h2>
      <input
        type="search"
        placeholder="Search weapons..."
        aria-label="Search weapons"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />
      <ul className="weapon-results">
        {matches.map((m) => (
          <li key={m.index}>
            <button
              type="button"
              className={m.index === selected ? "selected" : ""}
              aria-pressed={m.index === selected}
              onClick={() => onSelect(m.index)}
            >
              {m.name}
            </button>
          </li>
        ))}
        {matches.length === 0 && <li className="no-match">No weapons match.</li>}
      </ul>
    </section>
  );
}
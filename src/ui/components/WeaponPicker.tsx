interface Match {
  index: number;
  name: string;
}

interface Props {
  query: string;
  onQueryChange: (query: string) => void;
  matches: Match[];
  picked: number[];
  onToggle: (index: number) => void;
}

export default function WeaponPicker({ query, onQueryChange, matches, picked, onToggle }: Props) {
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
        {matches.map((m) => {
          const isPicked = picked.includes(m.index);
          return (
            <li key={m.index}>
              <button
                type="button"
                className={isPicked ? "selected" : ""}
                aria-pressed={isPicked}
                onClick={() => onToggle(m.index)}
              >
                {m.name}
              </button>
            </li>
          );
        })}
        {matches.length === 0 && <li className="no-match">No weapons match.</li>}
      </ul>
    </section>
  );
}
import { AFFINITIES, type AffinityKey } from "../affinities";
import { Icon } from "../icons";

interface Props {
  selected: Set<AffinityKey>;
  onToggle: (key: AffinityKey) => void;
}

export default function AffinityFilter({ selected, onToggle }: Props) {
  return (
    <section className="affinity-filter">
      <h2>Affinity</h2>
      <div className="affinity-grid">
        {AFFINITIES.map((a) => (
          <label key={a.key} title={a.label}>
            <input type="checkbox" checked={selected.has(a.key)} onChange={() => onToggle(a.key)} />
            <Icon name={a.icon} />
            <span>{a.label}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
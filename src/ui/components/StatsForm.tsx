import { STAT_FIELDS, STAT_LABELS, parseStat, type StatField, type StatText } from "../stats";

interface Props {
  statText: StatText;
  onChange: (stat: StatField, text: string) => void;
}

export default function StatsForm({ statText, onChange }: Props) {
  return (
    <section className="stats-form">
      <h2>Attributes</h2>
      {STAT_FIELDS.map((stat) => (
        <label key={stat} className="stat-field">
          <span>{STAT_LABELS[stat]}</span>
          <input
            type="text"
            inputMode="numeric"
            value={statText[stat]}
            onChange={(e) => onChange(stat, e.target.value.replace(/\D/g, "").slice(0, 2))}
            onBlur={() => onChange(stat, String(parseStat(statText[stat])))}
          />
        </label>
      ))}
    </section>
  );
}
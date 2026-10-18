import {
  STAT_FIELDS, STAT_LABELS, STAT_SHORT, parseStat, type StatField, type StatText,
} from "../stats";

interface Props {
  statText: StatText;
  onChange: (stat: StatField, text: string) => void;
}

export default function StatsForm({ statText, onChange }: Props) {
  return (
    <section className="stats-bar" aria-label="Attributes">
      <div className="stats-inner">
        <h2>Attributes</h2>
        <div className="stat-row">
          {STAT_FIELDS.map((stat) => (
            <label key={stat} className="stat-field" title={STAT_LABELS[stat]}>
              <span>{STAT_SHORT[stat]}</span>
              <input
                type="text"
                inputMode="numeric"
                aria-label={STAT_LABELS[stat]}
                value={statText[stat]}
                onChange={(e) => onChange(stat, e.target.value.replace(/\D/g, "").slice(0, 2))}
                onBlur={() => onChange(stat, String(parseStat(statText[stat])))}
              />
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}
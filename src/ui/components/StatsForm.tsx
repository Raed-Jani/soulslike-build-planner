import type { ReactNode } from "react";
import {
  STAT_FIELDS, STAT_LABELS, STAT_SHORT, parseStat, type StatField, type StatText,
} from "../stats";

interface Props {
  statText: StatText;
  onChange: (stat: StatField, text: string) => void;
  label?: string;
  headerAction?: ReactNode;
  headerBadge?: string;
}

export default function StatsForm({ statText, onChange, label = "Attributes", headerAction, headerBadge }: Props) {
  return (
    <section className="stats-bar" aria-label={label}>
      <div className="stats-inner">
        <div className="stats-form-heading">{headerBadge && <span className="configuration-badge" aria-hidden="true">{headerBadge}</span>}<h2>{label}</h2>{headerAction}</div>
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

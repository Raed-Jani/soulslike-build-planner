import { displayAR, type ARDetail, type AttackResult } from "../../calculateAR";
import { allDamageTypes } from "../../weapon";
import { Icon } from "../icons";

export default function AttackPanel({ damage }: { damage: ARDetail["damage"] }) {
  // the game's rounding: each type rounded down, total = rounded-down sum of the unrounded values
  const totals: AttackResult = {};
  for (const type of allDamageTypes) {
    const d = damage[type];
    if (d) totals[type] = d.total;
  }
  const shown = displayAR(totals);

  const rows = allDamageTypes.flatMap((type) => {
    const d = damage[type];
    if (!d) return [];
    const total = shown.parts[type]!;
    const base = Math.floor(d.base);
    return [{ type, total, base, bonus: total - base, penalized: d.penalized }];
  });

  return (
    <section className="attack-panel">
      <h3>Attack power</h3>
      <ul>
        {rows.map((r) => (
          <li key={r.type}>
            <span className="damage-type">
              <Icon name={r.type} label={r.type[0].toUpperCase() + r.type.slice(1)} />
              {r.type}
            </span>
            <strong className="damage-total">{r.total}</strong>
            <span className="damage-split">
              {r.base} {r.bonus >= 0 ? "+" : "−"} {Math.abs(r.bonus)}
              {r.penalized && " (requirement penalty)"}
            </span>
          </li>
        ))}
      </ul>
      <p className="total-line">
        Total <strong>{shown.total}</strong>
      </p>
    </section>
  );
}
import type { ARDetail } from "../../calculateAR";
import { allStatusTypes } from "../../weapon";
import { StatusIcon } from "../icons";
import { STATUS_LABELS } from "../stats";

export default function StatusPanel({ status }: { status: ARDetail["status"] }) {
  const rows = allStatusTypes.flatMap((type) => {
    const s = status[type];
    return s ? [{ type, value: Math.floor(s.total), penalized: s.penalized }] : [];
  });
  if (rows.length === 0) return null;

  return (
    <section className="status-panel">
      <h3>Status effects</h3>
      <ul>
        {rows.map((r) => (
          <li
            key={r.type}
            data-unmet={r.penalized || undefined}
            title={r.penalized ? "Arcane requirement not met: buildup reduced" : undefined}
          >
            <StatusIcon type={r.type} label={STATUS_LABELS[r.type]} />
            <span>{STATUS_LABELS[r.type]}</span>
            <strong>{r.value}{r.penalized ? "*" : ""}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
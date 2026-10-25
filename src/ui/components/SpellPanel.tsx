import type { ARDetail } from "../../calculateAR";
import { allDamageTypes, type Weapon } from "../../weapon";
import { Icon } from "../icons";

interface Props {
  weapon: Weapon;
  spell: ARDetail["spell"];
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export default function SpellPanel({ weapon, spell }: Props) {
  if (!weapon.sorceryTool && !weapon.incantationTool) return null;

  const rows = allDamageTypes.flatMap((type) => {
    const s = spell[type];
    return s ? [{ type, value: Math.floor(s.scaling), penalized: s.penalized }] : [];
  });
  if (rows.length === 0) return null;

  const title =
    weapon.sorceryTool && weapon.incantationTool
      ? "Sorcery and incantation scaling"
      : weapon.sorceryTool
        ? "Sorcery scaling"
        : "Incantation scaling";
  const penaltyNote = "Requirement not met: scaling reduced";

  return (
    <section className="status-panel spell-panel">
      <h3>{title}</h3>
      <p className="spell-note">
        Spell-power scaling, not final spell damage. Each spell uses its own element's scaling.
      </p>

      <ul>
        {rows.map((r) => (
          <li
            key={r.type}
            data-unmet={r.penalized || undefined}
            title={r.penalized ? penaltyNote : undefined}
          >
            <Icon name={r.type} label={cap(r.type)} />
            <span>{cap(r.type)}</span>
            <strong>
              {r.value}%{r.penalized ? "*" : ""}
            </strong>
          </li>
        ))}
      </ul>

      {rows.some((r) => r.penalized) && <p className="spell-legend">* {penaltyNote}.</p>}
    </section>
  );
}

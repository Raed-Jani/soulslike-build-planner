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

  // staves with one shared value get the compact "All elements" line;
  // seals, and any weapon whose elements differ, show one entry per element
  const allSame = rows.every(
    (r) => r.value === rows[0].value && r.penalized === rows[0].penalized
  );
  const compact = allSame && Boolean(weapon.sorceryTool) && !weapon.incantationTool;
  const penaltyNote = "Requirement not met: scaling reduced";

  return (
    <section className="status-panel spell-panel">
      <h3>{title}</h3>
      <p className="spell-note">
        Spell power as a percentage: 100% means no bonus, 126% means spells deal 26% more. Each
        spell uses the value of its own element.
      </p>

      {compact ? (
        <p
          className="spell-all"
          data-unmet={rows[0].penalized || undefined}
          title={rows[0].penalized ? penaltyNote : undefined}
        >
          <span>All elements</span>
          <strong>
            {rows[0].value}%{rows[0].penalized ? "*" : ""}
          </strong>
        </p>
      ) : (
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
      )}

      {rows.some((r) => r.penalized) && <p className="spell-legend">* {penaltyNote}.</p>}
    </section>
  );
}
import type { ARDetail } from "../../calculateAR";
import { allDamageTypes, type Weapon } from "../../weapon";
import { Icon } from "../icons";

interface Props {
  weapon: Weapon;
  spell: ARDetail["spell"];
}

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

  // when every element has the same value, one row says it all
  const allSame = rows.every(
    (r) => r.value === rows[0].value && r.penalized === rows[0].penalized
  );
  const penaltyNote = "Requirement not met: scaling reduced";

  return (
    <section className="status-panel spell-panel">
      <h3>{title}</h3>
      <p className="spell-note">
        Spell power as a percentage: 100% means no bonus, 126% means spells deal 26% more. Each
        spell uses the value of its own element.
      </p>
      <ul>
        {allSame ? (
          <li data-unmet={rows[0].penalized || undefined} title={rows[0].penalized ? penaltyNote : undefined}>
            <span>All elements</span>
            <strong>{rows[0].value}%{rows[0].penalized ? "*" : ""}</strong>
          </li>
        ) : (
          rows.map((r) => {
            const label = r.type[0].toUpperCase() + r.type.slice(1);
            return (
              <li key={r.type} data-unmet={r.penalized || undefined} title={r.penalized ? penaltyNote : undefined}>
                <Icon name={r.type} label={label} />
                <span>{label}</span>
                <strong>{r.value}%{r.penalized ? "*" : ""}</strong>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
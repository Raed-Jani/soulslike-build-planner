import type { Attribute, Attributes } from "../../attributes";
import type { Weapon } from "../../weapon";
import { STAT_FIELDS, STAT_SHORT } from "../stats";

interface Props {
  weapon: Weapon;
  effective: Attributes; // the player's stats after the two-handing bonus
  unmet: Attribute[];
}

export default function RequirementsPanel({ weapon, effective, unmet }: Props) {
  return (
    <section className="requirements-panel">
      <h3>Attributes required</h3>
      <ul>
        {STAT_FIELDS.map((stat) => {
          const required = weapon.requirements[stat] ?? 0;
          const isUnmet = unmet.includes(stat);
          return (
            <li key={stat} data-unmet={isUnmet || undefined}>
              <span>{STAT_SHORT[stat]}</span>
              <strong>{required > 0 ? required : "-"}</strong>
              {isUnmet && <em> (yours: {effective[stat]})</em>}
            </li>
          );
        })}
      </ul>
      {unmet.length > 0 && (
        <p className="warning" role="status">
          Requirement not met: {unmet.map((s) => STAT_SHORT[s]).join(", ")}. Damage is reduced for
          the types that scale with it.
        </p>
      )}
    </section>
  );
}
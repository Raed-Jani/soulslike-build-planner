import { scalingGrade, type ScalingTiers } from "../../calculateAR";
import type { Weapon } from "../../weapon";
import { STAT_FIELDS, STAT_SHORT } from "../stats";

interface Props {
  weapon: Weapon;
  level: number;
  tiers: ScalingTiers;
}

export default function ScalingPanel({ weapon, level, tiers }: Props) {
  const scaling = weapon.attributeScaling[level];
  return (
    <section className="scaling-panel">
      <h3>Attribute scaling</h3>
      <ul>
        {STAT_FIELDS.map((stat) => (
          <li key={stat}>
            <span>{STAT_SHORT[stat]}</span>
            <strong>{scalingGrade(scaling[stat], tiers)}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
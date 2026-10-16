import {
  adjustForTwoHanding,
  ALWAYS_TWO_HANDED,
  calculateARDetail,
  type ScalingTiers,
} from "../../calculateAR";
import type { Attributes } from "../../attributes";
import type { Weapon } from "../../weapon";
import AttackPanel from "./AttackPanel";
import RequirementsPanel from "./RequirementsPanel";
import ScalingPanel from "./ScalingPanel";

interface Props {
  weapon: Weapon;
  stats: Attributes;
  tiers: ScalingTiers;
  level: number;
  onLevelChange: (level: number) => void;
  twoHanding: boolean;
  onTwoHandingChange: (value: boolean) => void;
}

export default function WeaponCard({
  weapon, stats, tiers, level, onLevelChange, twoHanding, onTwoHandingChange,
}: Props) {
  const maxLevel = weapon.attack.length - 1;
  const safeLevel = Math.min(level, maxLevel);
  const alwaysTwoHanded =
    weapon.weaponType !== undefined && ALWAYS_TWO_HANDED.includes(weapon.weaponType);

  const detail = calculateARDetail(weapon, stats, safeLevel, twoHanding);
  const effective = adjustForTwoHanding(weapon, stats, twoHanding);

  return (
    <article className="weapon-card">
      <header>
        <h2>{weapon.name}</h2>
        <label>
          Level{" "}
          <select value={safeLevel} onChange={(e) => onLevelChange(Number(e.target.value))}>
            {Array.from({ length: maxLevel + 1 }, (_, i) => (
              <option key={i} value={i}>+{i}</option>
            ))}
          </select>
        </label>{" "}
        <label>
          <input
            type="checkbox"
            checked={alwaysTwoHanded || twoHanding}
            disabled={alwaysTwoHanded || weapon.paired}
            onChange={(e) => onTwoHandingChange(e.target.checked)}
          />{" "}
          Two-handing
          {alwaysTwoHanded && " (always)"}
          {weapon.paired && " (no bonus for paired weapons)"}
        </label>
      </header>

      <AttackPanel damage={detail.damage} />
      <ScalingPanel weapon={weapon} level={safeLevel} tiers={tiers} />
      <RequirementsPanel weapon={weapon} effective={effective} unmet={detail.unmet} />
    </article>
  );
}
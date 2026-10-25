import { useId, useRef } from "react";
import { scalingGrade, type ScalingTiers } from "../../calculateAR";
import { affinityInfo, affinityKeyOf } from "../affinities";
import { Icon } from "../icons";
import { STAT_FIELDS, STAT_LABELS, STAT_SHORT } from "../stats";
import type { WeaponVariant } from "../statDistributions";

interface Props {
  configuration: string;
  variants: WeaponVariant[];
  selected: WeaponVariant;
  level: number;
  tiers: ScalingTiers;
  onSelect: (variant: WeaponVariant) => void;
}

function AffinityIcon({ id }: { id: number }) {
  const info = affinityInfo(affinityKeyOf(id));
  return info ? <Icon name={info.icon} size={20} /> : null;
}

export default function AffinityScalingPicker({ configuration, variants, selected, level, tiers, onSelect }: Props) {
  const group = useId();
  const disclosure = useRef<HTMLDetailsElement>(null);
  if (variants.length < 2) {
    return <p className="configuration-fixed-affinity"><AffinityIcon id={selected.affinityId} /> Affinity: {selected.label} · fixed</p>;
  }
  return (
    <details className="affinity-scaling-picker" ref={disclosure}>
      <summary aria-label={`Configuration ${configuration} affinity: ${selected.label}`}>
        <span className="affinity-picker-label">Affinity</span>
        <AffinityIcon id={selected.affinityId} /><strong>{selected.label}</strong>
        <svg className="affinity-picker-chevron" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
      </summary>
      <div className="affinity-scaling-content">
        <p>Scaling grades at +{level}. Grades alone do not determine attack rating.</p>
        <table>
          <caption className="sr-only">Affinity scaling for Configuration {configuration} at upgrade +{level}</caption>
          <thead><tr><th scope="col">Affinity</th>{STAT_FIELDS.map((stat) => <th key={stat} scope="col" title={STAT_LABELS[stat]}>{STAT_SHORT[stat]}</th>)}</tr></thead>
          <tbody>{variants.map((variant) => {
            const previewLevel = Math.min(level, variant.weapon.attributeScaling.length - 1);
            const chosen = variant.affinityId === selected.affinityId;
            return (
              <tr key={variant.affinityId} data-selected={chosen || undefined}>
                <th scope="row">
                  <label>
                    <input type="radio" name={group} checked={chosen}
                      aria-label={`${variant.label} affinity for Configuration ${configuration}`}
                      onChange={() => {
                        onSelect(variant);
                        if (disclosure.current) {
                          disclosure.current.open = false;
                          disclosure.current.querySelector("summary")?.focus({ preventScroll: true });
                        }
                      }} />
                    <AffinityIcon id={variant.affinityId} />
                    <span>{variant.label}{previewLevel !== level && <small>Preview +{previewLevel}</small>}</span>
                  </label>
                </th>
                {STAT_FIELDS.map((stat) => <td key={stat}>{scalingGrade(variant.weapon.attributeScaling[previewLevel][stat], tiers)}</td>)}
              </tr>
            );
          })}</tbody>
        </table>
      </div>
    </details>
  );
}

import { useId, useState } from "react";
import { compareDistributions } from "../../engine/compareDistributions";
import { ALWAYS_TWO_HANDED, type ScalingTiers } from "../../calculateAR";
import type { Weapon } from "../../weapon";
import { changeConfigurationAffinity, copyAToB, distributionAttributes, updateConfigurationSettings, updateDistribution, type ConfigurationId, type DistributionPair, type WeaponVariant } from "../statDistributions";
import { affinityInfo, affinityKeyOf } from "../affinities";
import { STAT_SHORT, STATUS_LABELS } from "../stats";
import StatsForm from "./StatsForm";
import AffinityScalingPicker from "./AffinityScalingPicker";

interface Props {
  weapon: Weapon;
  variants?: WeaponVariant[];
  tiers: ScalingTiers;
  pair: DistributionPair;
  onChange: (pair: DistributionPair) => void;
  onClose: () => void;
}
const signed = (value: number) => value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : "0";
const direction = (value: number) => value > 0 ? "increase" : value < 0 ? "decrease" : "unchanged";

export default function DistributionComparison({ weapon, variants: providedVariants, tiers, pair, onChange, onClose }: Props) {
  const [active, setActive] = useState<ConfigurationId>("b");
  const [expanded, setExpanded] = useState(true);
  const [copyMessage, setCopyMessage] = useState("");
  const editorId = useId();
  const variants = providedVariants ?? [{ weapon, affinityId: weapon.affinityId ?? 0, label: affinityInfo(affinityKeyOf(weapon.affinityId ?? 0))?.label ?? "Standard" }];
  const variantFor = (id: ConfigurationId) => variants.find((variant) => variant.affinityId === (pair[id].affinityId ?? weapon.affinityId)) ?? variants[0];
  const weaponA = variantFor("a").weapon;
  const weaponB = variantFor("b").weapon;
  const comparison = compareDistributions(weaponA, distributionAttributes(pair.a.statText), distributionAttributes(pair.b.statText), pair.a.level, pair.a.twoHanding, pair.b, weaponB);
  const alwaysTwoHanded = weapon.weaponType !== undefined && ALWAYS_TWO_HANDED.includes(weapon.weaponType);
  const settingsDiffer = variantFor("a").affinityId !== variantFor("b").affinityId || pair.a.level !== pair.b.level || (!weapon.paired && !alwaysTwoHanded && pair.a.twoHanding !== pair.b.twoHanding);
  const primarySpell = comparison.spell.find(({ type }) => type === (weapon.sorceryTool ? "magic" : "holy")) ?? comparison.spell[0];
  const headline = primarySpell ?? comparison.total;
  const headlineLabel = primarySpell ? comparison.uniformSpell ? "Spell scaling · all elements" : `${primarySpell.type[0].toUpperCase()}${primarySpell.type.slice(1)} spell scaling` : "Weapon attack rating";
  const unit = primarySpell ? "%" : "";
  const spellRows = comparison.uniformSpell ? comparison.spell.slice(0, 1).map((row) => ({ ...row, label: "All elements" })) : comparison.spell.map((row) => ({ ...row, label: row.type[0].toUpperCase() + row.type.slice(1) }));
  const rows = [
    ...(primarySpell || comparison.damage.length > 1 ? [{ label: "Total AR", ...comparison.total }] : []),
    ...comparison.damage.map(({ type, ...values }) => ({ label: `${type[0].toUpperCase()}${type.slice(1)} AR`, ...values })),
    ...comparison.status.map(({ type, ...values }) => ({ label: `${STATUS_LABELS[type]} buildup`, ...values })),
  ];
  return (
    <section className="distribution-comparison">
      <div className="distribution-heading">
        <h3><button type="button" className="distribution-disclosure" aria-label="Compare stat distributions" aria-expanded={expanded} aria-controls={`${editorId}-content`} onClick={() => setExpanded(!expanded)}>
          Stat comparison <span aria-hidden="true">{expanded ? "−" : "+"}</span>
        </button></h3>
        <button type="button" className="distribution-close" onClick={onClose} aria-label="Close comparison" title="Close comparison" aria-describedby={`${editorId}-close-help`}>
          <span aria-hidden="true">×</span>
        </button>
        <span className="sr-only" id={`${editorId}-close-help`}>Discard A/B and return to shared attributes.</span>
      </div>
      <p className="distribution-headline-label">{headlineLabel}</p>
      <div className="distribution-summary" aria-label={primarySpell ? "Spell scaling comparison" : "Total attack rating comparison"}>
        <div><span>Configuration A</span><strong>{headline.a}{unit}</strong><span>{variantFor("a").label} · +{pair.a.level}</span></div>
        <div><span>Configuration B</span><strong>{headline.b}{unit}</strong><span>{variantFor("b").label} · +{pair.b.level}</span></div>
        <div><span>Change · B − A</span><strong className="distribution-delta" data-direction={direction(headline.delta)}>{signed(headline.delta)}<small> {primarySpell ? "pp" : "AR"}</small></strong></div>
        {(comparison.requirementsMet.length > 0 || comparison.requirementsLost.length > 0) && <span className="requirement-met">Requirement change</span>}
      </div>
      {(comparison.unmetA.length > 0 || comparison.unmetB.length > 0) && (
        <div className="distribution-requirements" role="status">
          {comparison.unmetA.length > 0 && <p>Unmet in A: {comparison.unmetA.map((stat) => STAT_SHORT[stat]).join(", ")}</p>}
          {comparison.unmetB.length > 0 && <p>Unmet in B: {comparison.unmetB.map((stat) => STAT_SHORT[stat]).join(", ")}</p>}
          {comparison.requirementsMet.length > 0 && <p><span className="requirement-met">Requirement met in B</span> {comparison.requirementsMet.map((stat) => STAT_SHORT[stat]).join(", ")}. Changes may include penalty removal, not ordinary scaling alone.</p>}
          {comparison.requirementsLost.length > 0 && <p>Requirement lost in B: {comparison.requirementsLost.map((stat) => STAT_SHORT[stat]).join(", ")}. A requirement penalty may apply.</p>}
        </div>
      )}
      <div id={`${editorId}-content`} hidden={!expanded}>
      <p className="comparison-note distribution-intro">Same base weapon. Main card and top attribute edits use A; B stays independent.</p>
      <div className="distribution-switch" role="group" aria-label="Choose configuration editor">
        {(["a", "b"] as const).map((id) => (
          <button type="button" key={id} aria-pressed={active === id} aria-controls={`${editorId}-${id}`} onClick={() => setActive(id)}>
            Edit {id.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="distribution-editors">
        {(["a", "b"] as const).map((id) => (
          <div key={pair[id].id} id={`${editorId}-${id}`} data-configuration={id} className={`distribution-editor${active === id ? " is-active" : ""}`}>
            <StatsForm label={`Configuration ${id.toUpperCase()}`} headerBadge={id.toUpperCase()} statText={pair[id].statText}
              headerAction={id === "b" ? <button className="distribution-copy" type="button" onClick={() => {
                onChange(copyAToB(pair)); setActive("b"); setCopyMessage("A's affinity, attributes, upgrade and handing copied to B.");
              }}>Copy A → B</button> : undefined}
              onChange={(stat, text) => { setCopyMessage(""); onChange(updateDistribution(pair, id, stat, text)); }} />
            <div className="configuration-settings">
              <AffinityScalingPicker configuration={id.toUpperCase()} variants={variants} selected={variantFor(id)}
                level={pair[id].level} tiers={tiers} onSelect={(variant) => {
                  setCopyMessage(""); onChange(changeConfigurationAffinity(pair, id, variant));
                }} />
              <label>Upgrade level
                <select aria-label={`Configuration ${id.toUpperCase()} upgrade level`} value={pair[id].level} onChange={(event) => {
                  setCopyMessage(""); onChange(updateConfigurationSettings(pair, id, { level: Number(event.target.value) }));
                }}>
                  {Array.from({ length: variantFor(id).weapon.attack.length }, (_, value) => <option key={value} value={value}>+{value}</option>)}
                </select>
              </label>
              <label className="configuration-handing">
                <input type="checkbox" aria-label={`Configuration ${id.toUpperCase()} two-handing`}
                  checked={alwaysTwoHanded || (!weapon.paired && pair[id].twoHanding)} disabled={alwaysTwoHanded || weapon.paired}
                  onChange={(event) => { setCopyMessage(""); onChange(updateConfigurationSettings(pair, id, { twoHanding: event.target.checked })); }} />
                <span className="configuration-toggle" aria-hidden="true" />
                <span>Two-hand {alwaysTwoHanded ? "(always)" : weapon.paired ? "(no bonus)" : ""}</span>
              </label>
            </div>
          </div>
        ))}
      </div>
      <p className="comparison-note" role="status">{copyMessage}</p>
      {settingsDiffer && <p className="comparison-note">Different affinity, upgrade or handling settings also affect the results.</p>}
      <div className="distribution-budget">
        <span>Offensive attributes</span>
        <strong>A {comparison.offensiveTotal.a}</strong><strong>B {comparison.offensiveTotal.b}</strong>
        <span className="distribution-budget-delta">{signed(comparison.offensiveTotal.delta)} points</span>
        {comparison.offensiveTotal.delta === 0 && <span className="distribution-equal-total">Same total</span>}
      </div>
      {comparison.attributes.some(({ delta }) => delta !== 0) && <ul className="distribution-stat-deltas" aria-label="Attribute differences B minus A">
        {comparison.attributes.filter(({ delta }) => delta !== 0).map(({ stat, delta }) => <li key={stat}>{STAT_SHORT[stat]} {signed(delta)}</li>)}
      </ul>}
      {comparison.spell.length > 0 && <>
        <table className="distribution-results">
          <caption>Spell scaling (%) · B − A</caption>
          <thead><tr><th scope="col">Element</th><th scope="col">A</th><th scope="col">B</th><th scope="col">Change</th></tr></thead>
          <tbody>{spellRows.map((row) => <tr key={row.type}><th scope="row">{row.label}</th><td>{row.a}%</td><td>{row.b}%</td><td className="distribution-delta" data-direction={direction(row.delta)}>{signed(row.delta)} pp</td></tr>)}</tbody>
        </table>
      </>}
      <table className="distribution-results">
        <caption>Displayed results · B − A</caption>
        <thead><tr><th scope="col">Outcome</th><th scope="col">A</th><th scope="col">B</th><th scope="col">Change</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th><td>{row.a}</td><td>{row.b}</td><td className="distribution-delta" data-direction={direction(row.delta)}>{signed(row.delta)}</td></tr>)}</tbody>
      </table>
      <details className="comparison-explanation">
        <summary>About rounding and comparison values</summary>
        <p>Each damage type is rounded down separately; total AR is rounded down after adding unrounded values, so the displayed parts may not add up. Zero can hide a fractional change.</p>
        {comparison.spell.length > 0 && <p>pp means percentage points of spell scaling, not percentage change in final spell damage. Identical raw values across modeled elements are grouped; differing elements remain separate. Weapon AR is separate.</p>}
        <p>Offensive attribute totals cover Strength, Dexterity, Intelligence, Faith and Arcane, not character level or points spent leveling. Higher output with more points does not imply greater efficiency.</p>
        <p>AR and each buildup are separate outcomes, with no overall ranking. Colors indicate numerical increases or decreases.</p>
        <p>Close comparison discards A/B and returns the card to shared attributes. Collapsing preserves both configurations.</p>
      </details>
      </div>
    </section>
  );
}

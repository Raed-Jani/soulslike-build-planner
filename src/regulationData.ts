import type { Attribute } from "./attributes";
import type { DamageType } from "./weapon";
import type { ScalingTiers } from "./calculateAR";

// ── Raw shape of regulation-vanilla-v1.17.json ──────────────────────────────

/** One stage of a calc-correct graph, as stored in the JSON. */
interface CalcCorrectStage {
  maxVal: number;
  maxGrowVal: number;
  adjPt: number;
}

/** Per-level reinforce multipliers for one weapon type. */
interface ReinforceRow {
  attack: (number | undefined)[];
  attributeScaling: Partial<Record<Attribute, number>>;
  statusSpEffectId1: number;
  statusSpEffectId2: number;
  statusSpEffectId3: number;
}

/** Attack-element-correct entry: which stats drive which damage type. */
type AttackElementCorrectRaw = Partial<Record<number, Partial<Record<Attribute, number | true>>>>;

/** A raw weapon record from the JSON (before buildWeapon processes it). */
export interface RawWeapon {
  name: string;
  weaponType: number;
  affinityId: number;
  reinforceTypeId: number;
  attackElementCorrectId: number;
  paired: boolean;
  sorceryTool: boolean;
  incantationTool: boolean;
  requirements: Partial<Record<Attribute, number>>;
  /** [damageTypeIndex, baseValue][] */
  attack: [number, number][];
  /** [statKey, baseScaling][] */
  attributeScaling: [Attribute, number][];
  calcCorrectGraphIds?: Partial<Record<number, number>>;
  statusSpEffectParamIds?: number[];
  /** Shadow of the Erdtree content */
  dlc?: boolean;
}

/** The full shape of the regulation JSON fetched at runtime. */
export interface RegulationData {
  weapons: RawWeapon[];
  /** id → stages */
  calcCorrectGraphs: Record<number, CalcCorrectStage[]>;
  /** id → per-level rows */
  reinforceTypes: Record<number, ReinforceRow[]>;
  /** id → per-damage-type maps */
  attackElementCorrects: Record<number, AttackElementCorrectRaw>;
  /** id → {[statusTypeId]: buildup} */
  statusSpEffectParams: Record<number, Record<number, number>>;
  /** [[threshold, letter], …] */
  scalingTiers: ScalingTiers;
}

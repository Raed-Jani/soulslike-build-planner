import type { Attribute } from "./attributes";
import type { ScalingTiers } from "./calculateAR";

// Shape of regulation-vanilla-v1.17.json

/** One stage of a calc-correct graph, as stored in the JSON. */
export interface CalcCorrectStage {
  maxVal: number;
  maxGrowVal: number;
  adjPt: number;
}

/** Multipliers for one upgrade level of a reinforcement track. */
export interface ReinforceRow {
  /** damage type id (0..4) -> multiplier. An object keyed by id in the JSON, not an array. */
  attack: Partial<Record<number, number>>;
  /** present for all five attributes in the data */
  attributeScaling: Record<Attribute, number>;
  statusSpEffectId1?: number;
  statusSpEffectId2?: number;
  statusSpEffectId3?: number;
}

/** Damage type id -> which attributes feed it (true = full scaling, a number = a fraction). */
export type AttackElementCorrectRaw = Partial<
  Record<number, Partial<Record<Attribute, number | true>>>
>;

/** A raw weapon record from the JSON, before buildWeapon processes it. */
export interface RawWeapon {
  name: string;
  weaponName: string;
  /** Explicit wiki page override; null disables linking. */
  url?: string | null;
  weaponType: number;
  affinityId: number;
  reinforceTypeId: number;
  attackElementCorrectId: number;
  /** missing for most weapons */
  paired?: boolean;
  sorceryTool?: boolean;
  incantationTool?: boolean;
  requirements: Partial<Record<Attribute, number>>;
  /** [damage or status type id, base value][] */
  attack: [number, number][];
  /** [attribute, base scaling][] */
  attributeScaling: [Attribute, number][];
  calcCorrectGraphIds?: Partial<Record<number, number>>;
  statusSpEffectParamIds?: number[];
  /** Shadow of the Erdtree content */
  dlc?: boolean;
}

/** The full shape of the regulation JSON fetched at runtime. */
export interface RegulationData {
  weapons: RawWeapon[];
  /** graph id -> stages */
  calcCorrectGraphs: Record<number, CalcCorrectStage[]>;
  /** track id -> one row per upgrade level */
  reinforceTypes: Record<number, ReinforceRow[]>;
  attackElementCorrects: Record<number, AttackElementCorrectRaw>;
  /** status parameter id -> { status type id: buildup } */
  statusSpEffectParams: Record<number, Record<number, number>>;
  /** [[threshold, letter], ...] from the highest threshold to the lowest */
  scalingTiers: ScalingTiers;
}

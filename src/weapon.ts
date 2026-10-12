import type { Curve } from "./curves";
import {fakeCurve} from "./curves";
import type { Attribute } from "./attributes";
export const allDamageTypes = ["physical", "magic", "fire", "lightning", "holy"] as const;
export type DamageType = (typeof allDamageTypes)[number];
export type AttackElementCorrect = Partial<
  Record<DamageType, Partial<Record<Attribute, number | true>>>
>;
export interface Weapon {
    name: string;
      // minimum stats to use the weapon properly
    requirements: Partial<Record<Attribute, number>>;
      // index = upgrade level, so attack[10] is the damage at +10
    attack: Partial<Record<DamageType, number>>[];
      // same idea: scaling coefficient per stat, per upgrade level
    attributeScaling: Partial<Record<Attribute, number>>[];
    calcCorrectGraphs: Record<DamageType, Curve>;
    attackElementCorrect: AttackElementCorrect;
    weaponType?: number;
    paired?: boolean;
} 

//test
export const testSword: Weapon = {
  name: "Test Sword",
  requirements: { str: 10, dex: 10 },
  attack: [
    { physical: 100 },   // +0
    { physical: 110 },   // +1
  ],
  attributeScaling: [
    { str: 0.5, dex: 0.3 },
    { str: 0.52, dex: 0.31 },
  ],
  attackElementCorrect: {
    physical: { str: true, dex: true  },
  },
  calcCorrectGraphs: {
  physical: fakeCurve,
  magic: fakeCurve,
  fire: fakeCurve,
  lightning: fakeCurve,
  holy: fakeCurve,
},
};
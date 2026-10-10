//all stats that can scale weapon damage 
export const allAtributes = ["str", "dex", "int", "fai", "arc"] as const;
export type Attribute = (typeof allAtributes)[number];
//character full stats (8 stats)
export interface Attributes {
    vig: number;
    mnd: number;
    end: number;
    str: number;
    dex: number;
    int: number;
    fai: number;
    arc: number;
}
//test
export const testCharacter: Attributes = {
  vig: 40, mnd: 15, end: 25, str: 20, dex: 20, int: 10, fai: 10, arc: 10,
};
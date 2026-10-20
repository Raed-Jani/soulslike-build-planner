//all stats that can scale weapon damage 
export const allAttributes = ["str", "dex", "int", "fai", "arc"] as const;
export type Attribute = (typeof allAttributes)[number];
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
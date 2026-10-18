export interface WeaponTypeInfo {
  id: number;
  label: string;
}

export interface WeaponTypeGroup {
  key: string;
  label: string;
  types: WeaponTypeInfo[];
}

// weaponType numbers come from the game data (weaponTypes.test.ts checks them against it).
// Staves (57), seals (61) and torches (87) are left out on purpose: they need spell scaling.
export const WEAPON_TYPE_GROUPS: WeaponTypeGroup[] = [
  {
    key: "melee",
    label: "Melee weapons",
    types: [
      { id: 1, label: "Dagger" },
      { id: 3, label: "Straight Sword" },
      { id: 5, label: "Greatsword" },
      { id: 7, label: "Colossal Sword" },
      { id: 9, label: "Curved Sword" },
      { id: 11, label: "Curved Greatsword" },
      { id: 13, label: "Katana" },
      { id: 14, label: "Twinblade" },
      { id: 15, label: "Thrusting Sword" },
      { id: 16, label: "Heavy Thrusting Sword" },
      { id: 17, label: "Axe" },
      { id: 19, label: "Greataxe" },
      { id: 21, label: "Hammer" },
      { id: 23, label: "Great Hammer" },
      { id: 24, label: "Flail" },
      { id: 25, label: "Spear" },
      { id: 28, label: "Great Spear" },
      { id: 29, label: "Halberd" },
      { id: 31, label: "Reaper" },
      { id: 35, label: "Fist" },
      { id: 37, label: "Claw" },
      { id: 39, label: "Whip" },
      { id: 41, label: "Colossal Weapon" },
      { id: 88, label: "Hand-to-Hand Art" },
      { id: 91, label: "Throwing Blade" },
      { id: 92, label: "Backhand Blade" },
      { id: 93, label: "Light Greatsword" },
      { id: 94, label: "Great Katana" },
      { id: 95, label: "Beast Claw" },
    ],
  },
  {
    key: "ranged",
    label: "Ranged weapons",
    types: [
      { id: 50, label: "Light Bow" },
      { id: 51, label: "Bow" },
      { id: 53, label: "Greatbow" },
      { id: 55, label: "Crossbow" },
      { id: 56, label: "Ballista" },
    ],
  },
  {
    key: "shields",
    label: "Shields",
    types: [
      { id: 65, label: "Small Shield" },
      { id: 67, label: "Medium Shield" },
      { id: 69, label: "Greatshield" },
      { id: 90, label: "Thrusting Shield" },
    ],
  },
  {
    key: "other",
    label: "Other",
    types: [{ id: 89, label: "Perfume Bottle" }],
  },
];
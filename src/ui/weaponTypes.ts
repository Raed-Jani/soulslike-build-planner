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
export const WEAPON_TYPE_GROUPS: WeaponTypeGroup[] = [
  {
    key: "melee",
    label: "Melee weapons",
    types: [
      { id: 17, label: "Axe" },
      { id: 92, label: "Backhand Blade" },
      { id: 95, label: "Beast Claw" },
      { id: 41, label: "Colossal Weapon" },
      { id: 7, label: "Colossal Sword" },
      { id: 37, label: "Claw" },
      { id: 11, label: "Curved Greatsword" },
      { id: 9, label: "Curved Sword" },
      { id: 1, label: "Dagger" },
      { id: 24, label: "Flail" },
      { id: 35, label: "Fist" },
      { id: 19, label: "Greataxe" },
      { id: 23, label: "Great Hammer" },
      { id: 94, label: "Great Katana" },
      { id: 28, label: "Great Spear" },
      { id: 5, label: "Greatsword" },
      { id: 29, label: "Halberd" },
      { id: 21, label: "Hammer" },
      { id: 88, label: "Hand-to-Hand" },
      { id: 16, label: "Heavy Thrusting Sword" },
      { id: 13, label: "Katana" },
      { id: 93, label: "Light Greatsword" },
      { id: 89, label: "Perfume Bottle" },
      { id: 31, label: "Reaper" },
      { id: 25, label: "Spear" },
      { id: 3, label: "Straight Sword" },
      { id: 15, label: "Thrusting Sword" },
      { id: 91, label: "Throwing Blade" },
      { id: 87, label: "Torch" },
      { id: 14, label: "Twinblade" },
      { id: 39, label: "Whip" }
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
    key: "casting",
    label: "Catalysts",
    types: [
      { id: 57, label: "Glintstone Staff" },
      { id: 61, label: "Sacred Seal" },
    ],
  },
];
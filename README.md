# Soulslike Build Planner

**Live demo: https://raed-jani.github.io/soulslike-build-planner/**

A free, open-source attack rating calculator for Elden Ring: pick any weapon, set its level and your stats, and see the damage per type, all calculated in your browser.

## Verification

- The calculation engine **matches an existing open-source calculator on every weapon in the game** (3,296 weapons, several upgrade levels, stat sets and one-handed/two-handed grips: 0 mismatches).
- It was also **checked by hand against a live calculator** ([eldenring.tclark.io](https://eldenring.tclark.io)) on specific builds (for example the Uchigatana and Moonveil).
- The engine is covered by unit tests (`npm test`), and the deploy pipeline runs them before publishing.

## What it does

- **Attack rating per damage type** (physical, magic, fire, lightning, holy) with individual base + scaling bonus breakdown and total AR
- **Upgrade levels**, with the correct maximum for each weapon (+25 regular or +10 somber)
- **Two-handing mechanics**, including special cases (paired weapons get no bonus, bows and ballistae are always two-handed)
- **Stat requirement penalties**, with visual warnings and accurate AR reduction when requirements are not met
- **Status buildup**, displaying passive and Arcane-scaled auxiliary effects (Bleed, Poison, Frostbite, Scarlet Rot, Sleep, Madness, Death Blight)
- **Spell scaling**, computing exact spell buff values for Glintstone Staves (sorceries) and Sacred Seals (incantations)
- **Shadow of the Erdtree (DLC) content**, tagged with distinct DLC badges
- **Search & category filtering**, by weapon name, weapon type, and affinity variants (Standard, Heavy, Keen, Quality, Magic, Fire, Flame Art, Lightning, Sacred, Poison, Blood, Cold, Occult)

**Out of scope:** enemy defense calculations, temporary buffs, talismans, and armor sets.

## Run it locally

```bash
npm install
npm run dev      # open the address it prints (it ends with /soulslike-build-planner/)
npm test         # unit tests
npm run build    # production build into dist/
```

## How it works

```
src/
  calculateAR.ts       attack rating engine (pure functions, no UI code)
  engine/buildWeapon   turns raw game data into typed weapon objects
  weapon.ts, ...       types
  ui/                  React app
public/data/           game parameter data (Elden Ring patch 1.17, vanilla)
scripts/               data extraction and verification tools
```

The game stores its data as linked tables. A build step joins them (base damage and scaling per upgrade level, which stats feed which damage type, and the stat-to-bonus curves), and the engine combines the result with your stats.

## Verifying against the reference calculator

`scripts/compareAll.ts` runs this engine and the reference calculator's own code on every weapon and reports any difference. It needs the reference repo cloned **next to this project**:

```bash
cd ..
git clone https://github.com/ThomasJClark/elden-ring-weapon-calculator.git reference-calculator
cd soulslike-build-planner
npx tsx scripts/compareAll.ts
```

The app, the tests and the other scripts don't need that clone.

## Credits and disclaimer

- Weapon data (`regulation-vanilla-v1.17`) and the scaling-curve evaluation come from [elden-ring-weapon-calculator](https://github.com/ThomasJClark/elden-ring-weapon-calculator) by Tom Clark (MIT License, full text in `THIRD_PARTY_LICENSE-elden-ring-weapon-calculator.txt`).
- The underlying game data belongs to FromSoftware / Bandai Namco. This is a fan-made, non-commercial project and is not affiliated with or endorsed by either company.
-The images are assets from ELDEN RING (c) FromSoftware / Bandai Namco, taken from the
elden-ring-weapon-calculator project. They are NOT covered by this repository's MIT license.
They are used in a fan-made, non-commercial tool and will be removed on request.

## License

MIT, see `LICENSE`.
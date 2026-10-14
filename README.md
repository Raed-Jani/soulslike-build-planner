# Soulslike Build Planner

**Live demo: https://raed-jani.github.io/soulslike-build-planner/**

A free, open-source attack rating calculator for Elden Ring: pick any weapon, set its level and your stats, and see the damage per type, all calculated in your browser.

## Verification

- The calculation engine **matches an existing open-source calculator on every weapon in the game** (3,296 weapons, several upgrade levels, stat sets and one-handed/two-handed grips: 0 mismatches).
- It was also **checked by hand against a live calculator** ([eldenring.tclark.io](https://eldenring.tclark.io)) on specific builds (for example the Uchigatana and Moonveil).
- The engine is covered by unit tests (`npm test`), and the deploy pipeline runs them before publishing.

## What it does

- Attack rating per damage type (physical, magic, fire, lightning, holy) and total
- Upgrade levels, with the correct maximum for each weapon (+25 or +10)
- Two-handing bonus, including the special cases (paired weapons get no bonus, bows and ballistae are always two-handed)
- Stat requirement penalty, with a warning when a requirement isn't met
- Search over all weapons, each affinity variant included

**Not covered yet:** spell scaling (staves, seals and torches are hidden), status buildup, buffs, enemy defense, armor and talismans.

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

## License

MIT, see `LICENSE`.
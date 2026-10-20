# Project Handoff: Soulslike Build Planner

## 1. Project Overview

**Soulslike Build Planner** is a browser-based Attack Rating (AR), spell scaling, and status effect calculator for Elden Ring, built with React, TypeScript, and Vite.
It calculates accurate damage values entirely on the client side using regulation data from Elden Ring patch 1.17 (`regulation-vanilla-v1.17.json`).

- **Live URL**: https://raed-jani.github.io/soulslike-build-planner/
- **Repository**: https://github.com/Raed-Jani/soulslike-build-planner

---

## 2. Architecture & File Structure

```
soulslike-build-planner/
├── .github/workflows/
│   └── deploy.yml              # CI/CD pipeline (runs tsc, test, and vite build)
├── docs/
│   └── formula.md              # Mathematical formula documentation
├── public/
│   └── data/
│       └── regulation-vanilla-v1.17.json  # Raw game regulation data
├── src/
│   ├── attributes.ts           # Attribute types (vig, mnd, end, str, dex, int, fai, arc)
│   ├── calculateAR.ts          # Pure AR, status, and spell scaling computation engine
│   ├── calculateAR.test.ts     # Vitest unit test suite (25 tests for AR engine)
│   ├── curves.ts               # Curve type definitions
│   ├── regulationData.ts       # Strictly typed TypeScript interfaces for the JSON data
│   ├── testFixtures.ts         # Shared test fixtures (testSword, testCharacter, fakeCurve)
│   ├── weapon.ts               # Core Weapon interface, damage types, affinities
│   ├── engine/
│   │   ├── buildWeapon.ts      # Hydrates raw JSON records into typed Weapon instances
│   │   └── buildWeapon.test.ts # Tests for hydration and DLC tagging
│   └── ui/
│       ├── App.tsx             # Root React component and state management
│       ├── affinities.ts       # Affinity mappings and icon associations
│       ├── icons.tsx           # SVG icons for damage types, affinities, and stats
│       ├── loadRegulation.ts   # Cached fetch loader for regulation data
│       ├── styles.css          # Theme and UI styling (dark Elden Ring aesthetic)
│       ├── weaponTypes.ts      # Weapon class groupings and categories
│       └── components/
│           ├── AffinityFilter.tsx    # Filter by weapon affinity
│           ├── AttackPanel.tsx       # Per-damage-type AR breakdown display
│           ├── Header.tsx            # Header with title, patch badge, and scope note
│           ├── LoadingError.tsx      # Graceful network error state with retry button
│           ├── RequirementsPanel.tsx # Stat requirements with unmet warnings
│           ├── ScalingPanel.tsx      # Letter grades for attribute scaling
│           ├── SpellPanel.tsx        # Sorcery and incantation spell buff display
│           ├── StatsForm.tsx         # User attribute inputs
│           ├── StatusPanel.tsx       # Bleed, frost, poison, scarlet rot, etc. buildup
│           ├── WeaponCard.tsx        # Detailed card for each selected weapon
│           ├── WeaponPicker.tsx      # Weapon search, DLC tags, and selection
│           └── WeaponTypeFilter.tsx  # Categorized weapon class selector
└── scripts/
    ├── compareAll.ts           # Batch verification against reference calculator
    └── compareSeals.ts         # Verification for sacred seals / spell scaling
```

---

## 3. Completed Work & Current State

### Accuracy & Engine Verification
- **Verified 3,296 weapons against reference calculator**: 0 mismatches across regular and somber weapons, single-handed and two-handed grips, and various attribute spreads.
- **Spell scaling**: Glintstone Staves and Sacred Seals correctly calculate catalyst spell buff from Int, Fai, and Arc.
- **Status buildup**: Bleed, Poison, Frostbite, Scarlet Rot, Sleep, Madness, and Death Blight accurately calculate auxiliary buildup with Arcane scaling.
- **Two-handing mechanics**: Correct 1.5× Strength multiplier, with exceptions handled (paired weapons do not receive bonus, bows/ballistae always two-handed).
- **Stat requirements**: Inability to wield applies 40% physical base penalty and eliminates scaling bonuses.

### Robustness & Code Quality
- **Deploy Workflow**: Added `npx tsc --noEmit` before `npm run build` in `.github/workflows/deploy.yml` to prevent type regressions.
- **Graceful Error Handling**: Added `LoadingError.tsx` with a user-friendly retry button if data fetch fails.
- **Clean Architecture**: Moved test fixtures (`testSword`, `testCharacter`, `fakeCurve`) out of production code into `src/testFixtures.ts`.
- **Strict Typing**: Created `RegulationData` and `RawWeapon` interfaces in `src/regulationData.ts`, removing `any` casts from data loading and UI layers.
- **Shadow of the Erdtree (DLC) Tags**: SOTE weapons now carry `dlc: true` flags, displaying prominent styled badges in the weapon search list, selected chips, and weapon cards.
- **Scope Disclaimer**: Added a clear note under the title: *"Calculates base Attack Power (AR). Does not include enemy defenses, buffs, or weapon-skill effects."*
- **Documentation**: Fully populated `docs/formula.md` with complete mathematical and architectural breakdowns.

---

## 4. Verification & Testing

- **Type Check**: `npm run typecheck` (`npx tsc --noEmit`) passes with 0 errors.
- **Unit Tests**: `npm test -- --run` passes all 43 tests across 4 test suites:
  - `src/ui/weaponTypes.test.ts` (2 tests)
  - `src/ui/affinities.test.ts` (13 tests)
  - `src/engine/buildWeapon.test.ts` (3 tests)
  - `src/calculateAR.test.ts` (25 tests)
- **Production Bundle**: `npm run build` generates optimized production output (`dist/`) cleanly.

---

## 5. Potential Future Work (Deferred / Optional)

- **Shareable URLs**: Encoding picked weapons, levels, and character stats into query params or hash for easy build sharing.
- **Local Storage Persistence**: Remembering user character stats across browser sessions.
- **DLC Only / Base Game Toggle**: Optional quick filter toggle to only show DLC weapons or exclude them.

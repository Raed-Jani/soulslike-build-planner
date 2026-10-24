# Golden integration tests

`src/engine/golden.integration.test.ts` reads the same patch 1.17 JSON used by
the application, calls `makeBuilder`, and passes real weapons to
`calculateARDetail`. Expected outputs are fixed literals, not values calculated
by the implementation under test. The suite does not use `src/data/weapons.ts`.

Run it with the installed project dependencies:

```bash
npm run test:run -- src/engine/golden.integration.test.ts
```

## Expected-value provenance

Recorded on 2026-10-24 using the separate reference implementation:

- Repository: https://github.com/ThomasJClark/elden-ring-weapon-calculator
- Local reference HEAD: `b8a1cf8847fe67aacc7f8fcb038a9cfd6725f19a`
- Reference functions: `decodeRegulationData` in `src/regulationData.ts` and
  `getWeaponAttack` in `src/calculator/calculator.ts`, with vanilla defaults.
- Input: this repository's `public/data/regulation-vanilla-v1.17.json`.
- Input SHA-256: `6ae98b99429cf63f3f2c6a737cf90f6e7507fa67c1dd7e45cad5937a2f3824a5`.

The reference decoder and calculator were run directly against that JSON;
their unrounded outputs were transcribed into the tests. Numeric comparisons
use eight decimal places to allow floating-point noise. Displayed rounding and
penalty flags have explicit assertions. The 605 total for Moonveil is computed
from unrounded damage, rather than summing its displayed 238 and 366 components.

This establishes regression protection and compatibility with a community
reference. It is not independent verification against the game: both
implementations use the same data and share some formula ancestry. Normal test
runs need neither the reference checkout nor network access.

## Coverage and updates

Cases cover regular and somber reinforcement, split damage, requirement
boundaries, Arcane-scaled bleed, upgrade-dependent frost buildup, paired weapons,
forced two-handing, effective Strength 148, catalyst scaling without base elemental
damage, and numeric Smithscript attribute corrections.

To add or update a case, select the exact weapon name in the reference decoder's
output and call `getWeaponAttack` with the test's five attributes, upgrade level,
and handing mode. Damage IDs 0–4 are physical, magic, fire, lightning, and holy;
status IDs 7 and 8 are bleed and frost. Record those raw outputs and the source
revision/data hash before changing expected literals. Investigate differences
instead of regenerating goldens from this project's builder or engine. Keep the
small synthetic unit tests: they isolate formulas and complement these runtime
pipeline checks.

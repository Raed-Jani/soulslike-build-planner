# How the attack rating is calculated

This document describes what the calculator does, step by step. The formulas are implemented in [`src/calculateAR.ts`](../src/calculateAR.ts), and the curves are built in [`src/engine/buildWeapon.ts`](../src/engine/buildWeapon.ts). The numbers come from the game data of patch 1.17 (`public/data/regulation-vanilla-v1.17.json`).

The engine matches the reference calculator's code on every weapon (see the README), so the rules below are the ones that calculator also uses. Where this document says "verified", it names how.

---

## 1. From game tables to a weapon

The game stores its data as linked tables. A raw weapon record holds only:

- its base attack per damage type and its base scaling per attribute, at level +0
- its attribute requirements
- ids that point at other tables: a **reinforcement track** (the multipliers for each upgrade level), an **attack-element-correct** entry (which attributes feed which damage type) and, optionally, **curves**

`buildWeapon` joins these into one object, so that the engine can read `attack[level][type]`, `attributeScaling[level][attribute]`, the attack-element-correct map and the curves directly.

## 2. Inputs

- the weapon, and its upgrade level $L$ (+0 to +25 for regular weapons, +0 to +10 for somber ones)
- the attributes Strength, Dexterity, Intelligence, Faith and Arcane (Vigor, Mind and Endurance do not affect weapon damage)
- one-handed or two-handed

## 3. Base damage and scaling at a level

Each upgrade level has multipliers. For damage type $d$ and attribute $a$:

$$B_d(L) = B_{d,0} \times M^{\text{attack}}_d(L) \qquad\qquad S_a(L) = S_{a,0} \times M^{\text{scaling}}_a(L)$$

$B_{d,0}$ and $S_{a,0}$ are the weapon's values at +0, and $M$ are the multipliers of its reinforcement track. So both the damage and the scaling grow with the level.

## 4. Which attributes feed which damage type

Each weapon has an attack-element-correct map. For each damage type it lists the attributes that scale it. For example, the Uchigatana's physical damage scales with Strength and Dexterity, and Moonveil's magic damage scales with Intelligence.

An entry is normally `true` (full scaling). Some weapons have a fraction $c$ instead (24 weapons in patch 1.17, for example the Smithscript hammers and axes). Then the scaling used is

$$S'_a(L) = c \times \frac{S_a(L)}{S_a(0)}$$

## 5. Curves

A curve turns an attribute value into a number between about 0 and 1 (the share of the scaling you receive). The data stores a curve as a list of stages, each with `maxVal`, `maxGrowVal` and `adjPt`. The code evaluates it once into an array $g[v]$ for $v = 0 \dots 148$, so a lookup is just `curve[stat]`. (148 because two-handing can raise Strength 99 to 148.)

Between two consecutive entries, with $v_0, g_0, p$ taken from the first entry and $v_1, g_1$ from the second:

$$t = \operatorname{clamp}\left(\frac{v - v_0}{v_1 - v_0},\, 0,\, 1\right)$$

$$t' = \begin{cases} t^{\,p} & p > 0 \\ 1 - (1 - t)^{-p} & p < 0 \\ t & p = 0 \end{cases} \qquad\qquad g(v) = g_0 + (g_1 - g_0)\, t'$$

The shape parameter $p$ (`adjPt`) is the one of the entry where the stage starts. This is a port of `evaluateCalcCorrectGraph` from the reference calculator (MIT license, see the README).

Each weapon uses curve 0 for its damage types unless it names another one. The soft caps are not hard-coded anywhere: they are where the stages of the curve bend. In the vanilla data, the default curve is 0.25 at an attribute value of 18.

## 6. Two-handing

Two-handing multiplies the effective Strength by 1.5, rounded down:

$$\text{Str}_{\text{eff}} = \lfloor 1.5 \times \text{Str} \rfloor$$

There is no cap at 99. Exceptions:

1. **Paired weapons** (flagged `paired` in the data, 258 weapons in patch 1.17) never get the bonus.
2. **Light bows, bows, greatbows and ballistae** (weapon types 50, 51, 53 and 56) are always treated as two-handed. Crossbows are not.

The effective Strength is also the value compared with the Strength requirement.

## 7. Requirements and the penalty

An attribute is **unmet** when the effective attribute is lower than the weapon's requirement.

The penalty is applied **per damage type**: if any attribute that a damage type scales with is unmet, that damage type gets no scaling bonus and is multiplied by 0.6 instead:

$$\text{AR}_d = B_d(L) \times 0.6$$

Damage types that do not scale with the unmet attribute are not affected. For example, if Moonveil's Intelligence requirement is not met, its magic damage is reduced, while its physical damage (which scales with Strength and Dexterity) is calculated normally.

## 8. Attack rating

When no penalty applies, for each damage type $d$:

$$\text{AR}_d = B_d(L) \times \left(1 + \sum_{a \,\in\, \text{AEC}(d)} S_a(L) \times g_d\!\left(\text{Stat}_a\right)\right)$$

where $\text{AEC}(d)$ is the set of attributes that feed $d$ (section 4), and $g_d$ is the curve of that damage type. The total is the sum over the damage types.

Only the damage types the weapon actually has base damage for are calculated.

## 9. How the numbers are shown

The game rounds each damage type **down**, and the total is the rounded-down sum of the **unrounded** values:

$$\text{shown}_d = \lfloor \text{AR}_d \rfloor \qquad\qquad \text{shown total} = \Big\lfloor \sum_d \text{AR}_d \Big\rfloor$$

So the total can be one higher than the sum of the shown parts. The "base + bonus" line is $\lfloor B_d \rfloor$ plus the difference to the shown value.

## 10. Status buildup

There are seven statuses: poison, scarlet rot, blood loss, frostbite, sleep, madness and death blight. The buildup at a level comes from the status parameter the weapon points at, shifted by an offset that depends on the upgrade level.

Only **poison, blood loss, sleep and madness** scale with Arcane. The others show their base value for the level. For those four:

$$\text{Buildup} = \text{Base}(L) \times \left(1 + S_{\text{arc}}(L) \times g_{\text{status}}(\text{Arc})\right)$$

with $\times\, 0.6$ instead when the Arcane requirement is not met. The default status curve is graph 6. Statuses that do not scale with Arcane are never reduced by the penalty.

## 11. Spell scaling (staves and seals)

For catalysts, the calculator reports a percentage for each element $e$. It uses the same multiplier as the attack rating, and it is reported even for elements where the weapon has no base damage:

$$\text{Spell}_e = 100 \times \left(1 + \sum_{a \,\in\, \text{AEC}(e)} S_a(L) \times g_e\!\left(\text{Stat}_a\right)\right)$$

100 means no bonus. With the requirement penalty the value is 60. Only elements that some attribute scales are listed. This is the multiplier on spell power. The damage of a specific spell would also need that spell's own base damage, which this calculator does not include.

## 12. Scaling grades

A scaling value $S_a(L)$ is shown as a letter: the first tier whose threshold it reaches. The tiers come from the data (`scalingTiers`):

| Letter | Threshold |
|---|---|
| S | ≥ 1.75 |
| A | ≥ 1.40 |
| B | ≥ 0.90 |
| C | ≥ 0.60 |
| D | ≥ 0.25 |
| E | ≥ 0.01 |
| - | below 0.01 |

## 13. Worked examples

**Uchigatana +0, Strength 18, Dexterity 18** (one-handed). From the data: base physical 115, scaling 0.36 (Strength) and 0.55 (Dexterity), and the curve value at 18 is 0.25.

$$115 \times (1 + 0.25 \times 0.36 + 0.25 \times 0.55) = 141.1625 \;\to\; 141$$

The reference calculator's website shows 141.

**Moonveil +10, Str 12, Dex 24, Int 40, Fai 10, Arc 10.** The engine gives physical 238.41 and magic 366.62, a sum of 605.03. The game and the reference website show 238, 366 and a total of 605, not 604.

**Uchigatana +25** with the same attributes gives 382.05, shown as 382.

## 14. Not modelled

Enemy defense and damage negation, temporary buffs, weapon skills and their motion values, armor and talismans, and the damage of individual spells. Only the vanilla data of patch 1.17 is supported.
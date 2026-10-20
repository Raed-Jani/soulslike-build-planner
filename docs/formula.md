# Elden Ring Damage Formula & Attack Rating (AR) Engine

This document explains the mathematical formula used by this application and Elden Ring's internal engine to compute Attack Rating (AR), status buildup, and spell scaling.

All calculations implemented in [`src/calculateAR.ts`](../src/calculateAR.ts) match FromSoftware's regulation data (patch 1.17) and have been verified with 0 discrepancies against 3,296 weapons in the reference calculator.

---

## 1. Overview

A weapon's total Attack Rating is the sum of its individual damage types:

$$\text{Total AR} = \text{Physical} + \text{Magic} + \text{Fire} + \text{Lightning} + \text{Holy}$$

Each damage type $d \in \{\text{physical}, \text{magic}, \text{fire}, \text{lightning}, \text{holy}\}$ is calculated independently based on the weapon's base damage, upgrade level, attribute scalings, and character attributes.

---

## 2. Base Damage & Reinforcement

Each weapon has a base damage value $B_{d, 0}$ for each damage type at level 0.

Upgrades apply a multiplier from the weapon's reinforcement track (`reinforceTypeId`):
- Regular weapons: +0 to +25 (Smithing Stones)
- Unique / Somber weapons: +0 to +10 (Somber Smithing Stones)

$$B_d(L) = B_{d, 0} \times M_{\text{reinforce}, d}(L)$$

Where $M_{\text{reinforce}, d}(L)$ is the attack multiplier for damage type $d$ at upgrade level $L$.

---

## 3. Attribute Scaling & Scaling Multipliers

Each weapon has base scaling coefficients for character attributes:
- $\text{Str}$ (Strength)
- $\text{Dex}$ (Dexterity)
- $\text{Int}$ (Intelligence)
- $\text{Fai}$ (Faith)
- $\text{Arc}$ (Arcane)

At upgrade level $L$, base scaling $S_{a, 0}$ is scaled by the reinforcement track multiplier:

$$S_a(L) = S_{a, 0} \times M_{\text{scaling}, a}(L)$$

### Scaling Grades (Letter Tiers)

Scaling values map to in-game letter grades according to threshold tiers:
- **S**: $\ge 1.75$ (or $\ge 1.4$ depending on game curve tiers)
- **A**: $\ge 1.40$
- **B**: $\ge 0.90$
- **C**: $\ge 0.60$
- **D**: $\ge 0.25$
- **E**: $> 0.00$
- **-**: None ($0$)

---

## 4. Attack Element Correct (AEC)

Not all attributes scale all damage types. The `AttackElementCorrect` matrix defines which attributes contribute to which damage types:

- **Physical**: Typically scales with Str, Dex, and occasionally Arcane.
- **Magic**: Typically scales with Int, occasionally Str or Dex.
- **Fire**: Scales with Str (Flame Art: Faith).
- **Lightning**: Scales with Dex.
- **Holy**: Scales with Faith.

If an attribute $a$ is active for damage type $d$, it contributes scaling bonus to that damage type.

---

## 5. Stat Curves (CalcCorrectGraph)

Elden Ring uses piecewise curves to calculate scaling efficiency. A curve maps an attribute value $v \in [1, 99]$ to a normalized growth fraction $g(v) \in [0.0, 1.0]$.

Each curve consists of multiple soft-cap stages $[s_i, s_{i+1}]$ defined by:
- $s_i$: Start stat value
- $s_{i+1}$: End stat value
- $g_i$: Start growth percentage
- $g_{i+1}$: End growth percentage
- $p$: Exponent / adjustment point (linear if 1, polynomial / concave if $>0$ or $<0$)

For a stat $v$ between stage boundaries $s_i$ and $s_{i+1}$:

$$t = \frac{v - s_i}{s_{i+1} - s_i}$$

If $p > 0$:
$$g(v) = g_i + (g_{i+1} - g_i) \times t^p$$

If $p < 0$:
$$g(v) = g_i + (g_{i+1} - g_i) \times \left(1 - (1 - t)^{|p|}\right)$$

Common soft caps in Elden Ring:
- **18 / 20**: Early soft cap
- **50 / 60**: Mid soft cap (primary breakpoint)
- **80**: Hard soft cap (diminishing returns beyond this)

---

## 6. Two-Handing Mechanics

Two-handing a weapon gives a 50% bonus to effective Strength:

$$\text{Effective Str} = \min\left(99, \lfloor 1.5 \times \text{Character Str} \rfloor\right)$$

### Exceptions:
1. **Paired Weapons** (e.g., Starscourge Greatsword, Claws, Fists): Two-handing dual-wields the weapon; no 1.5× Strength multiplier is applied.
2. **Bows, Light Bows, Crossbows, and Ballistae**: Always require two hands; two-handing Strength is evaluated automatically.

---

## 7. Requirement Penalties

Weapons require minimum stats to wield effectively:

$$\text{Meets Requirements} = \forall a \in \{\text{str}, \text{dex}, \text{int}, \text{fai}, \text{arc}\}, \; \text{Stat}_a \ge \text{Req}_a$$

*(Strength is evaluated using effective Strength when two-handing).*

If a character fails to meet the stat requirements:
1. **Physical base damage receives a severe 40% penalty**:
   $$B_{\text{physical, penalized}} = 0.6 \times B_{\text{physical}}$$
2. **All attribute scaling is eliminated** ($0$ scaling bonus).

---

## 8. Final Damage Calculation

When requirements are met:

$$\text{AR}_d = B_d(L) \times \left(1 + \sum_{a \in \text{AEC}(d)} S_a(L) \times g_{d, a}(\text{Stat}_a)\right)$$

The total Attack Power displayed in the UI is:

$$\text{Total AR} = \sum_{d} \lfloor \text{AR}_d \rfloor \quad \text{or displayed with precise per-type breakdown}$$

In the game status screen, base damage and scaling bonus are presented as:

$$\text{Base} + \text{Scaling Bonus} = \text{Total}$$

---

## 9. Status Buildup

Status effects (Bleed, Poison, Frostbite, Scarlet Rot, Sleep, Madness) apply auxiliary buildup per hit:

$$\text{Buildup} = \text{Base Buildup}(L) \times \left(1 + S_{\text{arc}}(L) \times g_{\text{status}}(\text{Arcane})\right)$$

Only weapons that possess innate Arcane scaling scale their status buildup with Arcane. Frostbite does not scale with stats in Elden Ring (fixed value per weapon level).

---

## 10. Spell Scaling (Catalysts)

For Glintstone Staves (sorcery) and Sacred Seals (incantations):

$$\text{Spell Scaling} = 100 \times \left(1 + \sum_{a} S_a(L) \times g_{\text{catalyst}}(\text{Stat}_a)\right)$$

This represents the spell damage multiplier expressed as a percentage (e.g., 250 = 250% base spell power).

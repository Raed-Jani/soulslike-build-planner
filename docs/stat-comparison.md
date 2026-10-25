# Manual stat-distribution comparison

On a weapon card, choose **Compare another stat distribution**. This copies the
shared attributes into independent configurations A and B. Top-bar attribute changes update that attribute in every open Configuration A,
leaving B unchanged. Editing within an A/B editor affects only that configuration.
The main card uses A while comparison is active.

The base weapon remains shared; A and B can select different available affinities. Each configuration has its own upgrade
level and two-handing control, initialized from the original card. The main card
uses A's chosen variant and settings. Bows remain always two-handed; paired weapons receive no
Strength bonus. A note flags differing settings so changes are not mistaken for
attribute effects alone.

Wide cards show both editors. Narrow cards offer **Edit A / Edit B** switches;
the result table always shows both configurations. **Close comparison** in the header
discards the pair and returns the card to the shared bar. Removing a weapon also
removes its pair.

## Results and interpretation

`src/engine/compareDistributions.ts` calls the existing engine twice with each
configuration's affinity variant, upgrade level and handing mode. Total AR floors the sum of unrounded damage types. Individual
damage and status values are floored separately. Differences are B minus A; the
total difference need not equal the sum of displayed damage-type differences.

Offensive attribute totals sum only Strength, Dexterity, Intelligence, Faith,
and Arcane. The UI shows the net difference and each attribute's change. These
are not character levels or points spent leveling: starting classes and the other
three attributes are not modeled. Equal totals do not imply universal superiority.

Newly satisfied and newly unmet requirements are explicit. AR and each buildup
remain separate, without a winner, combined score, automatic allocation, or
optimization. Inputs use the existing 1–99 normalization. Unmet warnings appear
above the editors only for configurations with unmet requirements.

Catalysts show spell scaling first, per element, alongside a separate weapon-AR
comparison. Scaling values are floored like the main spell panel. Their differences
are percentage points (pp), not relative percentages or final spell-damage gains.
The summary names the selected element: magic for sorcery tools, holy for
incantation-only tools, or the first available element if that one is absent.
All modeled elements remain available in the scaling table.

## State and sharing

Pairs are application state, not local editor state. Configuration IDs `a` and `b`
are scoped to a selected weapon and distinct from its stable weapon identifier.
Switching views does not recreate or lose attributes.

Share format v4 includes both configurations, their affinities and individual settings;
v1, v2 and v3 links remain supported. V2 pairs inherit their parent weapon settings. Editing
either configuration hides a previously generated link. Press Share again to
capture new state. See [share-links.md](share-links.md).

The comparison can be collapsed without losing either configuration; its result summary
remains visible. **Copy A → B** replaces B once with a separate copy of A, including upgrade and handing settings. Editing
B afterward leaves A unchanged. Only nonzero attribute differences are listed.
Signed green/red deltas indicate numerical increases/decreases, not a universal
recommendation. A rounding note explains why displayed damage parts can differ
from total AR. The former next-stat-point section has been removed.

The investment strip lists offensive totals and their difference; changed attributes
appear underneath. Rounding and interpretation details are in the expandable
**About rounding and comparison values** section. Single-damage weapons omit the
redundant total row because total AR remains in the summary. Split-damage weapons
and catalysts retain the total row. A/B badges connect the editors to the result
columns; B has a subtle accent, without implying it is the better configuration.

Affinity selectors contain only records available for that base weapon in the
shipped data. Fixed-affinity weapons show a label instead of a selector. Variant
changes clamp upgrade level to the new track. Copy A → B includes affinity.

Identical raw spell-scaling values across modeled elements are shown once as
All elements in the comparison only. The main card always retains its individual
element labels, icons and percentages. Both configurations must be uniform
to group comparison rows; equal rounded numbers alone are insufficient.
The close control is an icon-only × button with a tooltip and accessible name.

Affinity selection uses a collapsible picker with icons and a table of STR, DEX,
INT, FAI and ARC scaling grades. Grades use the dataset's thresholds at that
configuration's current upgrade level. A shorter variant track previews its own
maximum and labels that level. Selection closes the picker and returns focus to
its summary; native radios support keyboard selection. A and B use separate groups.

# Comparison share links

Press **Share comparison** to copy a link and update the address bar. If clipboard
access is unavailable, select and copy the visible link field. Bookmark that URL
to restore the comparison on refresh. After editing a comparison, press Share
again to update the link. Search text and browsing filters are not saved.

State lives in a URL fragment (`#build=` plus URI-encoded JSON); there is no
backend, account, or server-side storage. Initial loading and subsequent hash
navigation restore the comparison after the regulation data becomes available.

## Version 4 (current)

New links use `v: 4`. Configurations may include an integer `affinityId`; omission
uses the parent weapon affinity. Each affinity must exist for that exact base
weapon, and upgrade limits are checked against that variant. Unknown or mismatched
affinities reject the link rather than silently calculating a different weapon.
Older v1–v3 formats remain supported with the original parent affinity.

## Version 3 (still supported)

V3 links use `v: 3`. Each A/B configuration includes `level` (an integer valid
for the weapon) and `twoHanding` (boolean), in addition to `id` and `stats`.
For example: `{ "id": "b", "stats": [18,40,10,10,10], "level": 12, "twoHanding": true }`.
Settings are validated per weapon before restoration. V1 and v2 links still load;
v2 configurations inherit the level and handing from their parent weapon entry.

## Version 2 (still supported)

V2 links use `v: 2`. Shared stats, weapon identifiers, and weapon settings keep
their v1 meanings. A weapon entry may additionally include this field:

```json
{
  "configurations": [
    { "id": "a", "stats": [18, 40, 10, 10, 10] },
    { "id": "b", "stats": [23, 35, 10, 10, 10] }
  ]
}
```

Configuration IDs are distinct from weapon IDs and scoped to the parent weapon.
Exactly one `a` and one `b` are required when configurations are present. Both use
the parent weapon's affinity, upgrade and handing settings. All configuration
input is validated; configurations for missing weapons are skipped with that
weapon. Ordinary weapon entries need no configurations.

## Version 1 (still supported)

```json
{
  "v": 1,
  "patch": "1.17",
  "stats": [18, 24, 40, 10, 60],
  "weapons": [
    { "id": "-1:Moonveil", "level": 10, "twoHanding": false },
    { "id": "1:Uchigatana", "level": 12, "twoHanding": true }
  ]
}
```

Attributes are ordered Strength, Dexterity, Intelligence, Faith, Arcane. Weapons
retain selection order. Each identifier is the exact numeric affinity ID, a colon,
and the base `weaponName`. This combination is unique in the shipped dataset and
survives array reordering and additions. Display names and array indexes are not
persisted. The current data does not include numeric game weapon IDs. A future
base-name rename or affinity-ID change requires an explicit compatibility mapping
to preserve old links; do not silently change this identifier scheme.

`v` versions the serialization format independently of the game-data patch.
Unsupported formats are rejected. V1, v2, v3 and v4 are decoded; future formats should
retain that compatibility. A patch mismatch warns that results use the currently shipped
patch, rather than claiming to reproduce historical results. Unknown weapons are
skipped with a warning. Ambiguous IDs, duplicate selections, invalid attributes,
invalid upgrade levels, and malformed handing settings are rejected before state
is applied, preserving the current comparison on failure.

Links support at most 100 selected weapons and 32,000 fragment characters. These
limits bound parsing and rendering work; they do not guarantee every messaging
service accepts long links. No filter or calculation rules are inferred from
untrusted link contents. Tests cover restoration across reordered datasets and
equality of the resulting calculations.

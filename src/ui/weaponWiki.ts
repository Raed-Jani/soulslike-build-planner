import type { Weapon } from "../weapon";

export function weaponWikiUrl(weapon: Pick<Weapon, "weaponName" | "url">): string | undefined {
  if (weapon.url === null) return undefined;
  if (weapon.url !== undefined) {
    // Only accept links to the intended wiki, including data-provided overrides.
    try {
      const url = new URL(weapon.url);
      return url.protocol === "https:" && url.hostname === "eldenring.wiki.gg"
        ? url.href
        : undefined;
    } catch {
      return undefined;
    }
  }
  if (!weapon.weaponName?.trim()) return undefined;
  return `https://eldenring.wiki.gg/wiki/${encodeURIComponent(weapon.weaponName.trim().replaceAll(" ", "_"))}`;
}

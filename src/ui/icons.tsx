import { useState, type ReactNode } from "react";

export type IconName =
  | "physical" | "magic" | "fire" | "lightning" | "holy"
  | "heavy" | "keen" | "quality" | "cold" | "poison" | "blood" | "occult" | "unique";

// Set to false to use the simple drawn icons instead of the game images
const USE_GAME_ICONS = true;

// files in public/img/game/ (damage types reuse the matching affinity icon)
const GAME_ICON_FILES: Partial<Record<IconName, string>> = {
  physical: "standardAffinity.webp",
  magic: "magicAffinity.webp",
  fire: "fireAffinity.webp",
  lightning: "lightningAffinity.webp",
  holy: "sacredAffinity.webp",
  heavy: "heavyAffinity.webp",
  keen: "keenAffinity.webp",
  quality: "qualityAffinity.webp",
  cold: "coldAffinity.webp",
  poison: "poisonAffinity.webp",
  blood: "bloodAffinity.webp",
  occult: "occultAffinity.webp",
  unique: "specialWeapon.webp",
};
const PATHS: Record<IconName, ReactNode> = {
  physical: <path d="M20 4 9 15M6 12l6 6M9 15l-4 4" />,
  magic: <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z" fill="currentColor" />,
  fire: <path d="M12 2.5c.5 3.5-4.5 5.5-4.5 10.5a4.5 4.5 0 0 0 9 0c0-2-1-3.2-2-4.2-.3 1.2-1 2-1.8 2.2.6-3-.2-5.7-.7-8.5z" fill="currentColor" />,
  lightning: <path d="M13 2 5 13h6l-1 9 9-12h-6z" fill="currentColor" />,
  holy: <path d="M12 3v18M6 9h12" />,
  heavy: <rect x="6" y="6" width="12" height="12" rx="2" />,
  keen: <path d="m12 3 5 9-5 9-5-9z" />,
  quality: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  cold: <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" />,
  poison: (
    <>
      <circle cx="9" cy="14" r="4" />
      <circle cx="16" cy="9" r="3" />
      <circle cx="16.5" cy="17" r="2" />
    </>
  ),
  blood: <path d="M12 3s-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11z" fill="currentColor" />,
  occult: (
    <>
      <path d="M2 12c3-6 17-6 20 0-3 6-17 6-20 0z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  unique: <path d="m12 3 2.6 6.2 6.7.5-5.1 4.3 1.6 6.5L12 17l-5.8 3.5 1.6-6.5L2.7 9.7l6.7-.5z" fill="currentColor" />,
};

export function Icon({ name, size = 22, label }: { name: IconName; size?: number; label?: string }) {
  const [failed, setFailed] = useState(false);
  const file = GAME_ICON_FILES[name];

  if (USE_GAME_ICONS && file && !failed) {
    return (
      <img
        className="icon icon-img"
        src={`${import.meta.env.BASE_URL}img/game/${file}`}
        width={size}
        height={size}
        alt={label ?? ""}
        title={label}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <svg
      className={`icon icon-${name}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {label && <title>{label}</title>}
      {PATHS[name]}
    </svg>
  );
}
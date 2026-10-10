// curve[statValue] = how much of the scaling you've unlocked (0 to about 1)
// length 100, so indexes 0..99 are valid stat values
export type Curve = number[];

// FAKE test curve (a straight line that maxes out at stat 80).
// Real curves are not straight, and the real numbers come from the game data later.
export const fakeCurve: Curve = Array.from({ length: 100 }, (_, stat) =>
  Math.min(stat / 80, 1)
);

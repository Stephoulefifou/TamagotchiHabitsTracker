// FULLNESS
// How full the slime is (0 to 5), and its body size.
// We save the value + WHEN it was saved, and calculate what was lost since then.

// SETTINGS
export const MAX_FULLNESS = 5;                    // full after 5 apples
const LOSE_ONE_EVERY = 4 * 60 * 60 * 1000;        // loses 1 every 4 hours (in ms)
const SKINNY_AFTER = 24 * 60 * 60 * 1000;         // skinny after 24 hours at 0 (in ms)

// What is saved in Firebase
export type Fullness = {
  value: number;     // fullness when it was saved
  updatedAt: number; // when it was saved (Date.now())
};

export type BodySize = "skinny" | "normal" | "big";

// The fullness right now: the saved value, minus what was lost since
export function currentFullness(fullness: Fullness, now: number = Date.now()): number {
  const lost = Math.max(0, Math.floor((now - fullness.updatedAt) / LOSE_ONE_EVERY));
  return Math.max(0, fullness.value - lost);
}

// The body size right now
export function bodySize(fullness: Fullness, now: number = Date.now()): BodySize {
  const value = currentFullness(fullness, now);

  if (value >= MAX_FULLNESS) return "big";
  if (value > 0) return "normal";

  // At 0: since when? (the moment the last point was lost)
  const emptySince = fullness.updatedAt + fullness.value * LOSE_ONE_EVERY;
  return now - emptySince >= SKINNY_AFTER ? "skinny" : "normal";
}
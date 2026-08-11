export const STAT_FIELDS = [
  "shots",
  "shotsOnTarget",
  "corners",
  "fouls",
  "offsides",
  "saves",
  "freeKicks",
  "throwIns",
  "goalkicks",
  "penalties",
] as const;

export type StatField = (typeof STAT_FIELDS)[number];
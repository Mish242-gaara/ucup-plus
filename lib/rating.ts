/**
 * Player match rating — a simple, fully transparent formula since UCUP has
 * no official per-match rating provider (unlike Sofascore's proprietary
 * algorithm). Starts at a neutral 6.0 and adjusts from real tracked events:
 *
 *   +1.0  per goal
 *   +0.7  per assist
 *   -0.5  per yellow card
 *   -1.5  per red card (or second yellow)
 *   +0.3  if the player's team won the match
 *   -0.3  if the player's team lost the match
 *    0    if the match was a draw
 *
 * Clamped to [1, 10] and rounded to one decimal, matching the familiar
 * "/10" rating format.
 */
export function computeMatchRating(input: {
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  teamResult: "win" | "draw" | "loss";
}): number {
  let rating = 6.0;
  rating += input.goals * 1.0;
  rating += input.assists * 0.7;
  rating -= input.yellowCards * 0.5;
  rating -= input.redCards * 1.5;
  rating += input.teamResult === "win" ? 0.3 : input.teamResult === "loss" ? -0.3 : 0;

  return Math.round(Math.min(10, Math.max(1, rating)) * 10) / 10;
}

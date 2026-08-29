/**
 * Number of random candidates to generate and evaluate per round.
 */
export const CANDIDATE_COUNT = 1000;

/**
 * Default number of lookahead rounds to generate.
 */
export const DEFAULT_LOOKAHEAD_ROUNDS = 5;

/**
 * Default number of courts.
 */
export const DEFAULT_COURT_COUNT = 1;

/**
 * Players per court (doubles = 4).
 */
export const PLAYERS_PER_COURT = 4;

// --- Scoring Weights ---
// Higher weight = more influence on final score.
// All weights are positive. Penalties are subtracted from score.

/** Weight for pair duplication penalty. */
export const WEIGHT_PAIR_DUPLICATION = 10;

/** Weight for opponent duplication penalty. */
export const WEIGHT_OPPONENT_DUPLICATION = 8;

/** Weight for consecutive play penalty. */
export const WEIGHT_CONSECUTIVE_PLAY = 5;

/** Weight for consecutive rest penalty. */
export const WEIGHT_CONSECUTIVE_REST = 6;

/** Weight for play count fairness penalty. */
export const WEIGHT_PLAY_COUNT_FAIRNESS = 10;

/** Weight for stamina fit penalty. */
export const WEIGHT_STAMINA_FIT = 7;

// --- Stamina Target Play Rates ---
// Maps stamina level (1-5) to target play rate.
// 10% increments from 60% to 100%.

export const STAMINA_TARGET_RATES: Record<number, number> = {
  1: 0.60,
  2: 0.70,
  3: 0.80,
  4: 0.90,
  5: 1.00,
};

/** Default stamina level for new players. */
export const DEFAULT_STAMINA: 1 | 2 | 3 | 4 | 5 = 5;

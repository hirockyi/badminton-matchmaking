import { StaminaLevel } from './types';

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
export const DEFAULT_COURT_COUNT = 2;

/**
 * Default initial number of players.
 */
export const DEFAULT_PLAYER_COUNT = 8;

/**
 * Players per court (doubles = 4).
 */
export const PLAYERS_PER_COURT = 4;

/**
 * Maximum number of courts selectable in the UI.
 */
export const MAX_SELECTABLE_COURTS = 8;

/**
 * Default stamina level for new players (median value: 3 out of 5).
 */
export const DEFAULT_STAMINA: StaminaLevel = 3;

// --- Scoring Weights ---
// Higher weight = more influence on final score. Penalties are subtracted.
// Priority order: Play count fairness & spread > Rest/play continuity > Pair/opp duplication

/** Weight for deviation from stamina-adjusted target play count (absolute count based). */
export const WEIGHT_PLAY_COUNT_FAIRNESS = 30;

/** Weight for maximum spread penalty (difference between max and min played games within same stamina). */
export const WEIGHT_MAX_MIN_SPREAD = 50;

/** Weight for deviation from stamina-adjusted target play rate (legacy alias). */
export const WEIGHT_STAMINA_FIT = WEIGHT_PLAY_COUNT_FAIRNESS;

/** Weight for consecutive play penalty (base weight scaled by player stamina). */
export const WEIGHT_CONSECUTIVE_PLAY = 10;

/** Weight for consecutive rest penalty (base weight scaled by player stamina). */
export const WEIGHT_CONSECUTIVE_REST = 10;

/** Weight for pair duplication penalty (avoiding teaming up with the same person). */
export const WEIGHT_PAIR_DUPLICATION = 12;

/** Weight for opponent duplication penalty (avoiding playing against the same person). */
export const WEIGHT_OPPONENT_DUPLICATION = 8;

// --- Recency Decay Rates ---
// Closer rounds carry full weight (1.0). Older rounds decay exponentially based on cycle length.

/** Fallback decay rate per elapsed round for pair duplication if not computed dynamically. */
export const DECAY_RATE_PAIR_DUPLICATION = 0.85;

/** Fallback decay rate per elapsed round for opponent duplication if not computed dynamically. */
export const DECAY_RATE_OPPONENT_DUPLICATION = 0.80;

/**
 * Stamina relative weights (median stamina 3 = 1.0).
 * Used to calculate dynamic target play rates based on court capacity vs player count.
 */
export const STAMINA_RELATIVE_WEIGHTS: Record<StaminaLevel, number> = {
  1: 0.5,
  2: 0.75,
  3: 1.0,
  4: 1.25,
  5: 1.5,
};

/**
 * Multiplier for consecutive play penalty by stamina.
 * Stamina 1: strict aversion (5.0x).
 * Stamina 5: no penalty (0.0x) - happy to play back-to-back.
 */
export const STAMINA_CONSECUTIVE_PLAY_MULTIPLIER: Record<StaminaLevel, number> = {
  1: 5.0,
  2: 2.5,
  3: 1.0,
  4: 0.3,
  5: 0.0,
};

/**
 * Multiplier for consecutive rest penalty by stamina.
 * Stamina 5: strict aversion to resting (4.0x).
 * Stamina 1: no penalty (0.0x) - happy to rest multiple rounds.
 */
export const STAMINA_CONSECUTIVE_REST_MULTIPLIER: Record<StaminaLevel, number> = {
  1: 0.0,
  2: 0.3,
  3: 1.0,
  4: 2.5,
  5: 4.0,
};

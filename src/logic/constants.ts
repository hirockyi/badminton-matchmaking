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

/** Weight for pair duplication penalty (avoiding teaming up with the same person). */
export const WEIGHT_PAIR_DUPLICATION = 12;

/** Weight for opponent duplication penalty (avoiding playing against the same person). */
export const WEIGHT_OPPONENT_DUPLICATION = 8;

/** Weight for consecutive play penalty (base weight scaled by player stamina). */
export const WEIGHT_CONSECUTIVE_PLAY = 8;

/** Weight for consecutive rest penalty (base weight scaled by player stamina). */
export const WEIGHT_CONSECUTIVE_REST = 8;

/** Weight for deviation from stamina-adjusted target play rate. */
export const WEIGHT_STAMINA_FIT = 15;

// --- Recency Decay Rates ---
// Closer rounds carry full weight (1.0). Older rounds decay exponentially.
// e.g. rate = 0.8: 1 round ago = 1.0, 2 rounds ago = 0.8, 3 rounds ago = 0.64, 4 rounds ago = 0.51...

/** Decay rate per elapsed round for pair duplication. */
export const DECAY_RATE_PAIR_DUPLICATION = 0.80;

/** Decay rate per elapsed round for opponent duplication. */
export const DECAY_RATE_OPPONENT_DUPLICATION = 0.80;

/**
 * Stamina relative weights (median stamina 3 = 1.0).
 * Used to calculate dynamic target play rates based on court capacity vs player count.
 */
export const STAMINA_RELATIVE_WEIGHTS: Record<StaminaLevel, number> = {
  1: 0.50, // 50% relative to standard
  2: 0.75, // 75% relative to standard
  3: 1.00, // 100% (median / standard baseline)
  4: 1.25, // 125% relative to standard
  5: 1.50, // 150% relative to standard
};

/**
 * Multiplier for consecutive play penalty by stamina.
 * Stamina 1: heavily penalized for playing back-to-back games (must avoid consecutive games).
 * Stamina 5: no penalty for consecutive games (can play continuously).
 */
export const STAMINA_CONSECUTIVE_PLAY_MULTIPLIER: Record<StaminaLevel, number> = {
  1: 5.0, // Strict avoidance of back-to-back games
  2: 2.5,
  3: 1.0, // Standard consecutive play penalty
  4: 0.3,
  5: 0.0, // Stamina 5 loves consecutive games (no penalty)
};

/**
 * Multiplier for consecutive rest penalty by stamina.
 * Stamina 5: heavily penalized for resting back-to-back rounds (should not sit out continuously).
 * Stamina 1: no penalty for continuous rest (resting is welcomed).
 */
export const STAMINA_CONSECUTIVE_REST_MULTIPLIER: Record<StaminaLevel, number> = {
  1: 0.0, // Stamina 1 can rest continuously without penalty
  2: 0.3,
  3: 1.0, // Standard consecutive rest penalty
  4: 2.5,
  5: 4.0, // Stamina 5 should not sit out continuously
};

import { Match, Player, Round, RoundCandidate } from './types';
import {
  WEIGHT_PAIR_DUPLICATION,
  WEIGHT_OPPONENT_DUPLICATION,
  WEIGHT_CONSECUTIVE_PLAY,
  WEIGHT_CONSECUTIVE_REST,
  WEIGHT_PLAY_COUNT_FAIRNESS,
  WEIGHT_STAMINA_FIT,
  STAMINA_TARGET_RATES,
} from './constants';

// Helper: get all player IDs playing in a round's matches
function getPlayingPlayerIds(matches: Match[]): Set<string> {
  const ids = new Set<string>();
  for (const m of matches) {
    ids.add(m.team1[0]);
    ids.add(m.team1[1]);
    ids.add(m.team2[0]);
    ids.add(m.team2[1]);
  }
  return ids;
}

// Helper: get all pairs from matches (within same team)
function getPairs(matches: Match[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (const m of matches) {
    pairs.push(sortPair(m.team1[0], m.team1[1]));
    pairs.push(sortPair(m.team2[0], m.team2[1]));
  }
  return pairs;
}

// Helper: get all opponent pairs (cross-team)
function getOpponentPairs(matches: Match[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (const m of matches) {
    // Each player on team1 faces each player on team2
    for (const p1 of m.team1) {
      for (const p2 of m.team2) {
        pairs.push(sortPair(p1, p2));
      }
    }
  }
  return pairs;
}

function sortPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function pairKey(a: string, b: string): string {
  const [x, y] = sortPair(a, b);
  return `${x}:${y}`;
}

/**
 * Pair duplication penalty.
 * Counts how many times the proposed pairs have appeared in history.
 * Returns sum of historical pair counts for all pairs in the candidate.
 */
export function calcPairDuplicationPenalty(
  candidate: RoundCandidate,
  confirmedRounds: Round[]
): number {
  // Build historical pair count map
  const pairCounts = new Map<string, number>();
  for (const round of confirmedRounds) {
    for (const pair of getPairs(round.matches)) {
      const key = pairKey(pair[0], pair[1]);
      pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
    }
  }

  let penalty = 0;
  for (const pair of getPairs(candidate.matches)) {
    const key = pairKey(pair[0], pair[1]);
    penalty += pairCounts.get(key) || 0;
  }
  return penalty;
}

/**
 * Opponent duplication penalty.
 * Counts how many times the proposed opponent matchups have appeared in history.
 */
export function calcOpponentDuplicationPenalty(
  candidate: RoundCandidate,
  confirmedRounds: Round[]
): number {
  const oppCounts = new Map<string, number>();
  for (const round of confirmedRounds) {
    for (const pair of getOpponentPairs(round.matches)) {
      const key = pairKey(pair[0], pair[1]);
      oppCounts.set(key, (oppCounts.get(key) || 0) + 1);
    }
  }

  let penalty = 0;
  for (const pair of getOpponentPairs(candidate.matches)) {
    const key = pairKey(pair[0], pair[1]);
    penalty += oppCounts.get(key) || 0;
  }
  return penalty;
}

/**
 * Consecutive play penalty.
 * Counts how many players in the candidate also played in the last round.
 * Only applies when there are more active players than court slots.
 */
export function calcConsecutivePlayPenalty(
  candidate: RoundCandidate,
  lastRound: Round | null
): number {
  if (!lastRound) return 0;
  const lastPlaying = getPlayingPlayerIds(lastRound.matches);
  const currentPlaying = getPlayingPlayerIds(candidate.matches);
  let penalty = 0;
  for (const id of currentPlaying) {
    if (lastPlaying.has(id)) penalty += 1;
  }
  return penalty;
}

/**
 * Consecutive rest penalty.
 * Counts how many players who rested last round are also resting this round.
 */
export function calcConsecutiveRestPenalty(
  candidate: RoundCandidate,
  lastRound: Round | null
): number {
  if (!lastRound) return 0;
  const lastBench = new Set(lastRound.benchPlayerIds);
  let penalty = 0;
  for (const id of candidate.benchPlayerIds) {
    if (lastBench.has(id)) penalty += 1;
  }
  return penalty;
}

/**
 * Play count fairness penalty.
 * Measures how unevenly players have played relative to their available rounds.
 * Uses standard deviation of play rates (games played / games available since join).
 * Takes into account joinedAtRound for mid-session joins.
 */
export function calcPlayCountFairnessPenalty(
  candidate: RoundCandidate,
  confirmedRounds: Round[],
  players: Player[],
  currentRoundIndex: number
): number {
  const currentPlaying = getPlayingPlayerIds(candidate.matches);
  
  // Calculate play rate for each active player if this candidate is used
  const rates: number[] = [];
  for (const player of players) {
    if (!player.active) continue;
    const availableRounds = currentRoundIndex - player.joinedAtRound + 1;
    if (availableRounds <= 0) continue;
    
    // Count historical games
    let gamesPlayed = 0;
    for (const round of confirmedRounds) {
      if (getPlayingPlayerIds(round.matches).has(player.id)) {
        gamesPlayed++;
      }
    }
    // Add this candidate
    if (currentPlaying.has(player.id)) {
      gamesPlayed++;
    }
    
    rates.push(gamesPlayed / availableRounds);
  }

  if (rates.length < 2) return 0;

  // Standard deviation of play rates
  const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
  const variance = rates.reduce((sum, r) => sum + (r - mean) ** 2, 0) / rates.length;
  return Math.sqrt(variance) * 10; // Scale up for meaningful penalty
}

/**
 * Stamina fit penalty.
 * Measures deviation of each player's play rate from their stamina-based target.
 * Sum of squared differences between actual play rate and target play rate.
 */
export function calcStaminaFitPenalty(
  candidate: RoundCandidate,
  confirmedRounds: Round[],
  players: Player[],
  currentRoundIndex: number
): number {
  const currentPlaying = getPlayingPlayerIds(candidate.matches);
  let totalPenalty = 0;

  for (const player of players) {
    if (!player.active) continue;
    const availableRounds = currentRoundIndex - player.joinedAtRound + 1;
    if (availableRounds <= 0) continue;

    let gamesPlayed = 0;
    for (const round of confirmedRounds) {
      if (getPlayingPlayerIds(round.matches).has(player.id)) {
        gamesPlayed++;
      }
    }
    if (currentPlaying.has(player.id)) {
      gamesPlayed++;
    }

    const actualRate = gamesPlayed / availableRounds;
    const targetRate = STAMINA_TARGET_RATES[player.stamina] ?? 1.0;
    totalPenalty += (actualRate - targetRate) ** 2;
  }

  return totalPenalty * 10; // Scale up
}

/**
 * Calculate total score for a candidate round.
 * Higher score = better candidate.
 * Score starts at 0, penalties are subtracted with their weights.
 */
export function scoreCandidate(
  candidate: RoundCandidate,
  confirmedRounds: Round[],
  players: Player[],
  currentRoundIndex: number,
  lastRound: Round | null
): number {
  const pairPenalty = calcPairDuplicationPenalty(candidate, confirmedRounds);
  const opponentPenalty = calcOpponentDuplicationPenalty(candidate, confirmedRounds);
  const consecutivePlayPenalty = calcConsecutivePlayPenalty(candidate, lastRound);
  const consecutiveRestPenalty = calcConsecutiveRestPenalty(candidate, lastRound);
  const fairnessPenalty = calcPlayCountFairnessPenalty(candidate, confirmedRounds, players, currentRoundIndex);
  const staminaPenalty = calcStaminaFitPenalty(candidate, confirmedRounds, players, currentRoundIndex);

  const score =
    - WEIGHT_PAIR_DUPLICATION * pairPenalty
    - WEIGHT_OPPONENT_DUPLICATION * opponentPenalty
    - WEIGHT_CONSECUTIVE_PLAY * consecutivePlayPenalty
    - WEIGHT_CONSECUTIVE_REST * consecutiveRestPenalty
    - WEIGHT_PLAY_COUNT_FAIRNESS * fairnessPenalty
    - WEIGHT_STAMINA_FIT * staminaPenalty;

  return score;
}

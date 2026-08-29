import { Match, Player, Round, RoundCandidate } from './types';
import {
  WEIGHT_PAIR_DUPLICATION,
  WEIGHT_OPPONENT_DUPLICATION,
  WEIGHT_CONSECUTIVE_PLAY,
  WEIGHT_CONSECUTIVE_REST,
  WEIGHT_STAMINA_FIT,
  PLAYERS_PER_COURT,
  STAMINA_RELATIVE_WEIGHTS,
  STAMINA_CONSECUTIVE_PLAY_MULTIPLIER,
  STAMINA_CONSECUTIVE_REST_MULTIPLIER,
} from './constants';

// Helper: get all player IDs playing in a round's matches
export function getPlayingPlayerIds(matches: Match[]): Set<string> {
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
export function getPairs(matches: Match[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (const m of matches) {
    pairs.push(sortPair(m.team1[0], m.team1[1]));
    pairs.push(sortPair(m.team2[0], m.team2[1]));
  }
  return pairs;
}

// Helper: get all opponent pairs (cross-team)
export function getOpponentPairs(matches: Match[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (const m of matches) {
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
 * Calculate capacity-aware dynamic target play rates for each active player,
 * considering the court capacity to player count ratio and stamina weighting.
 */
export function calcDynamicTargetPlayRates(
  activePlayers: Player[],
  courtCount: number
): Map<string, number> {
  const targetMap = new Map<string, number>();
  if (activePlayers.length === 0) return targetMap;

  const courtSlots = courtCount * PLAYERS_PER_COURT;
  const baseRate = Math.min(1.0, courtSlots / activePlayers.length);

  // Calculate mean stamina relative weight among active players
  const totalWeight = activePlayers.reduce(
    (sum, p) => sum + (STAMINA_RELATIVE_WEIGHTS[p.stamina] ?? 1.0),
    0
  );
  const avgWeight = totalWeight / activePlayers.length;

  for (const player of activePlayers) {
    const playerWeight = STAMINA_RELATIVE_WEIGHTS[player.stamina] ?? 1.0;
    // Scale the base rate by the ratio of this player's weight to the group average
    const targetRate = Math.min(1.0, Math.max(0.0, baseRate * (playerWeight / avgWeight)));
    targetMap.set(player.id, targetRate);
  }

  return targetMap;
}

/**
 * Pair duplication penalty.
 * Sum of historical pair frequencies for all pairs in the candidate.
 */
export function calcPairDuplicationPenalty(
  candidate: RoundCandidate,
  confirmedRounds: Round[]
): number {
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
 * Sum of historical opponent matchup frequencies for all matchups in the candidate.
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
 * Consecutive play penalty weighted by player stamina.
 * Stamina 1 gets massive penalty for playing consecutively.
 * Stamina 5 gets 0 penalty.
 */
export function calcConsecutivePlayPenalty(
  candidate: RoundCandidate,
  lastRound: Round | null,
  playersById: Map<string, Player>
): number {
  if (!lastRound) return 0;
  const lastPlaying = getPlayingPlayerIds(lastRound.matches);
  const currentPlaying = getPlayingPlayerIds(candidate.matches);

  let penalty = 0;
  for (const id of currentPlaying) {
    if (lastPlaying.has(id)) {
      const player = playersById.get(id);
      const stamina = player?.stamina ?? 3;
      const multiplier = STAMINA_CONSECUTIVE_PLAY_MULTIPLIER[stamina] ?? 1.0;
      penalty += multiplier;
    }
  }
  return penalty;
}

/**
 * Consecutive rest penalty weighted by player stamina.
 * Stamina 5 gets heavy penalty for resting back-to-back.
 * Stamina 1 gets 0 penalty (resting is good).
 */
export function calcConsecutiveRestPenalty(
  candidate: RoundCandidate,
  lastRound: Round | null,
  playersById: Map<string, Player>
): number {
  if (!lastRound) return 0;
  const lastBench = new Set(lastRound.benchPlayerIds);

  let penalty = 0;
  for (const id of candidate.benchPlayerIds) {
    if (lastBench.has(id)) {
      const player = playersById.get(id);
      const stamina = player?.stamina ?? 3;
      const multiplier = STAMINA_CONSECUTIVE_REST_MULTIPLIER[stamina] ?? 1.0;
      penalty += multiplier;
    }
  }
  return penalty;
}

/**
 * Stamina fit penalty.
 * Measures deviation of each active player's cumulative play rate from their
 * capacity-aware dynamic target play rate, accounting for joinedAtRound.
 */
export function calcStaminaFitPenalty(
  candidate: RoundCandidate,
  confirmedRounds: Round[],
  activePlayers: Player[],
  currentRoundIndex: number,
  courtCount: number
): number {
  const currentPlaying = getPlayingPlayerIds(candidate.matches);
  const targetRates = calcDynamicTargetPlayRates(activePlayers, courtCount);

  let totalPenalty = 0;

  for (const player of activePlayers) {
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
    const targetRate = targetRates.get(player.id) ?? 0.8;

    // Squared deviation from capacity-aware target
    totalPenalty += (actualRate - targetRate) ** 2;
  }

  return totalPenalty * 10;
}

/**
 * Calculate total score for a candidate round.
 * Higher score = better candidate.
 */
export function scoreCandidate(
  candidate: RoundCandidate,
  confirmedRounds: Round[],
  allPlayers: Player[],
  activePlayers: Player[],
  currentRoundIndex: number,
  lastRound: Round | null,
  courtCount: number
): number {
  const playersById = new Map<string, Player>(allPlayers.map((p) => [p.id, p]));

  const pairPenalty = calcPairDuplicationPenalty(candidate, confirmedRounds);
  const opponentPenalty = calcOpponentDuplicationPenalty(candidate, confirmedRounds);
  const consecutivePlayPenalty = calcConsecutivePlayPenalty(candidate, lastRound, playersById);
  const consecutiveRestPenalty = calcConsecutiveRestPenalty(candidate, lastRound, playersById);
  const staminaFitPenalty = calcStaminaFitPenalty(
    candidate,
    confirmedRounds,
    activePlayers,
    currentRoundIndex,
    courtCount
  );

  const score =
    - WEIGHT_PAIR_DUPLICATION * pairPenalty
    - WEIGHT_OPPONENT_DUPLICATION * opponentPenalty
    - WEIGHT_CONSECUTIVE_PLAY * consecutivePlayPenalty
    - WEIGHT_CONSECUTIVE_REST * consecutiveRestPenalty
    - WEIGHT_STAMINA_FIT * staminaFitPenalty;

  return score;
}

import { Player, Match, Round, RoundCandidate } from './types';
import { CANDIDATE_COUNT, PLAYERS_PER_COURT } from './constants';
import { scoreCandidate } from './scoring';

/**
 * Fisher-Yates shuffle (in-place).
 */
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate a single random candidate round from active players.
 */
function generateRandomCandidate(
  activePlayers: Player[],
  courtCount: number
): RoundCandidate {
  const shuffled = shuffle(activePlayers);
  const totalSlots = courtCount * PLAYERS_PER_COURT;
  const playing = shuffled.slice(0, totalSlots);
  const benched = shuffled.slice(totalSlots);

  const matches: Match[] = [];
  for (let c = 0; c < courtCount; c++) {
    const start = c * PLAYERS_PER_COURT;
    const courtPlayers = playing.slice(start, start + PLAYERS_PER_COURT);
    if (courtPlayers.length === PLAYERS_PER_COURT) {
      matches.push({
        courtIndex: c,
        team1: [courtPlayers[0].id, courtPlayers[1].id],
        team2: [courtPlayers[2].id, courtPlayers[3].id],
      });
    }
  }

  return {
    matches,
    benchPlayerIds: benched.map((p) => p.id),
    score: 0,
  };
}

/**
 * Generate a single optimized round.
 * Creates CANDIDATE_COUNT random candidates, scores each, and returns the best.
 */
export function generateRound(
  activePlayers: Player[],
  courtCount: number,
  historyRounds: Round[],
  allPlayers: Player[],
  currentRoundIndex: number
): Round {
  const lastRound = historyRounds.length > 0
    ? historyRounds[historyRounds.length - 1]
    : null;

  // Ensure we have enough players
  if (activePlayers.length < PLAYERS_PER_COURT) {
    return {
      roundIndex: currentRoundIndex,
      matches: [],
      benchPlayerIds: activePlayers.map((p) => p.id),
    };
  }

  // Adjust court count if not enough active players
  const effectiveCourtCount = Math.min(
    courtCount,
    Math.floor(activePlayers.length / PLAYERS_PER_COURT)
  );

  let bestCandidate: RoundCandidate | null = null;
  let bestScore = -Infinity;

  for (let i = 0; i < CANDIDATE_COUNT; i++) {
    const candidate = generateRandomCandidate(activePlayers, effectiveCourtCount);
    const score = scoreCandidate(
      candidate,
      historyRounds,
      allPlayers,
      activePlayers,
      currentRoundIndex,
      lastRound,
      effectiveCourtCount
    );
    candidate.score = score;

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  }

  return {
    roundIndex: currentRoundIndex,
    matches: bestCandidate?.matches ?? [],
    benchPlayerIds: bestCandidate?.benchPlayerIds ?? [],
  };
}

/**
 * Generate multiple rounds consecutively.
 * Each round considers previous history including freshly generated rounds.
 */
export function generateMultipleRounds(
  activePlayers: Player[],
  courtCount: number,
  historyRounds: Round[],
  allPlayers: Player[],
  startRoundIndex: number,
  count: number
): Round[] {
  const rounds: Round[] = [];
  const cumulativeHistory = [...historyRounds];

  for (let i = 0; i < count; i++) {
    const roundIndex = startRoundIndex + i;
    const round = generateRound(
      activePlayers,
      courtCount,
      cumulativeHistory,
      allPlayers,
      roundIndex
    );
    round.roundIndex = roundIndex;
    rounds.push(round);
    cumulativeHistory.push(round);
  }

  return rounds;
}

/**
 * Regenerate a single round at a specific index, considering all rounds before it.
 */
export function regenerateSingleRound(
  activePlayers: Player[],
  courtCount: number,
  allRounds: Round[],
  allPlayers: Player[],
  targetRoundIndex: number
): Round {
  const historyBefore = allRounds.filter((r) => r.roundIndex < targetRoundIndex);
  return generateRound(
    activePlayers,
    courtCount,
    historyBefore,
    allPlayers,
    targetRoundIndex
  );
}

/**
 * Regenerate all rounds starting from a specific index onward, using the history before that index.
 */
export function regenerateSubsequentRounds(
  activePlayers: Player[],
  courtCount: number,
  allRounds: Round[],
  allPlayers: Player[],
  fromRoundIndex: number
): Round[] {
  const historyBefore = allRounds.filter((r) => r.roundIndex < fromRoundIndex);
  const countToRegenerate = allRounds.length - fromRoundIndex;

  if (countToRegenerate <= 0) return allRounds;

  const newSubsequentRounds = generateMultipleRounds(
    activePlayers,
    courtCount,
    historyBefore,
    allPlayers,
    fromRoundIndex,
    countToRegenerate
  );

  return [...historyBefore, ...newSubsequentRounds];
}

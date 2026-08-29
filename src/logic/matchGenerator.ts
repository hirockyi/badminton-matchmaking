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
 * Creates CANDIDATE_COUNT random candidates, scores each, returns the best.
 */
export function generateRound(
  activePlayers: Player[],
  courtCount: number,
  confirmedRounds: Round[],
  allPlayers: Player[],
  currentRoundIndex: number
): Round {
  const lastRound = confirmedRounds.length > 0
    ? confirmedRounds[confirmedRounds.length - 1]
    : null;

  // Ensure we have enough players
  if (activePlayers.length < PLAYERS_PER_COURT) {
    return {
      roundIndex: currentRoundIndex,
      matches: [],
      benchPlayerIds: activePlayers.map((p) => p.id),
      status: 'pending',
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
      confirmedRounds,
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
    status: 'pending',
  };
}

/**
 * Generate multiple rounds with lookahead.
 * Each round is generated considering the previous rounds (including earlier lookahead rounds as if confirmed).
 */
export function generateMultipleRounds(
  activePlayers: Player[],
  courtCount: number,
  confirmedRounds: Round[],
  allPlayers: Player[],
  startRoundIndex: number,
  count: number
): Round[] {
  const rounds: Round[] = [];
  const virtualHistory = [...confirmedRounds];

  for (let i = 0; i < count; i++) {
    const roundIndex = startRoundIndex + i;
    const round = generateRound(
      activePlayers,
      courtCount,
      virtualHistory,
      allPlayers,
      roundIndex
    );
    round.roundIndex = roundIndex;
    rounds.push(round);
    // Add to virtual history so next lookahead round considers this one
    virtualHistory.push({ ...round, status: 'confirmed' });
  }

  return rounds;
}

/**
 * Regenerate a single round at a specific index.
 * Takes into account all confirmed rounds and any pending rounds before this index.
 */
export function regenerateRound(
  activePlayers: Player[],
  courtCount: number,
  confirmedRounds: Round[],
  pendingRoundsBefore: Round[],
  allPlayers: Player[],
  roundIndex: number
): Round {
  const virtualHistory = [
    ...confirmedRounds,
    ...pendingRoundsBefore.map((r) => ({ ...r, status: 'confirmed' as const })),
  ];
  return generateRound(
    activePlayers,
    courtCount,
    virtualHistory,
    allPlayers,
    roundIndex
  );
}

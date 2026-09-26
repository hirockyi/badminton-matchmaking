import { Player, Match, Round, RoundCandidate } from './types';
import {
  CANDIDATE_COUNT,
  PLAYERS_PER_COURT,
  TIME_BUDGET_PER_ROUND_MS,
  EXHAUSTIVE_SEARCH_MAX_COMBINATIONS,
} from './constants';
import { scoreCandidate } from './scoring';
import { reassignCourtIndices } from './courtReassignment';
import { enumerateAllCandidates } from './candidateEnumerator';

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
 * Generate a single round asynchronously with time budget and small-scale exhaustive search.
 * 
 * 1. If total combinations are small (<= EXHAUSTIVE_SEARCH_MAX_COMBINATIONS),
 *    evaluates 100% of combinations in a few milliseconds without using the time budget!
 * 2. If combinations are large, searches candidates up to timeBudgetMs (e.g. 800ms)
 *    and exits immediately if a zero-penalty perfect candidate is found.
 */
export async function generateRoundAsync(
  activePlayers: Player[],
  courtCount: number,
  historyRounds: Round[],
  allPlayers: Player[],
  currentRoundIndex: number,
  timeBudgetMs: number = TIME_BUDGET_PER_ROUND_MS
): Promise<Round> {
  const lastRound = historyRounds.length > 0
    ? historyRounds[historyRounds.length - 1]
    : null;

  if (activePlayers.length < PLAYERS_PER_COURT) {
    return {
      roundIndex: currentRoundIndex,
      matches: [],
      benchPlayerIds: activePlayers.map((p) => p.id),
    };
  }

  const effectiveCourtCount = Math.min(
    courtCount,
    Math.floor(activePlayers.length / PLAYERS_PER_COURT)
  );

  let bestCandidate: RoundCandidate | null = null;
  let bestScore = -Infinity;

  // Check if small-scale exhaustive search is possible
  const allCandidates = enumerateAllCandidates(
    activePlayers,
    effectiveCourtCount,
    EXHAUSTIVE_SEARCH_MAX_COMBINATIONS
  );

  if (allCandidates !== null && allCandidates.length > 0) {
    // Mode A: Exhaustive search (100% complete coverage in a few milliseconds)
    for (const candidate of allCandidates) {
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
        if (score === 0) break; // Perfect score found
      }
    }
  } else {
    // Mode B: Time-budgeted Monte Carlo search (up to timeBudgetMs)
    const startTime = performance.now();
    let lastYieldTime = startTime;
    let iterations = 0;

    while (true) {
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
        if (score === 0) break; // Perfect score found, exit early
      }

      iterations++;

      // Check time limit every 50 iterations to avoid performance.now() overhead
      if (iterations % 50 === 0) {
        const now = performance.now();
        if (now - startTime >= timeBudgetMs) {
          break;
        }
        // Yield briefly every 100ms to keep UI and animations smooth
        if (now - lastYieldTime >= 100) {
          await new Promise((resolve) => setTimeout(resolve, 0));
          lastYieldTime = performance.now();
        }
      }
    }
  }

  const rawMatches = bestCandidate?.matches ?? [];
  const optimizedMatches = reassignCourtIndices(
    rawMatches,
    historyRounds,
    lastRound
  );

  return {
    roundIndex: currentRoundIndex,
    matches: optimizedMatches,
    benchPlayerIds: bestCandidate?.benchPlayerIds ?? [],
  };
}

/**
 * Generate a single optimized round (synchronous version for testing and legacy calls).
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

  if (activePlayers.length < PLAYERS_PER_COURT) {
    return {
      roundIndex: currentRoundIndex,
      matches: [],
      benchPlayerIds: activePlayers.map((p) => p.id),
    };
  }

  const effectiveCourtCount = Math.min(
    courtCount,
    Math.floor(activePlayers.length / PLAYERS_PER_COURT)
  );

  let bestCandidate: RoundCandidate | null = null;
  let bestScore = -Infinity;

  // Check if small-scale exhaustive search is possible
  const allCandidates = enumerateAllCandidates(
    activePlayers,
    effectiveCourtCount,
    EXHAUSTIVE_SEARCH_MAX_COMBINATIONS
  );

  if (allCandidates !== null && allCandidates.length > 0) {
    for (const candidate of allCandidates) {
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
        if (score === 0) break;
      }
    }
  } else {
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
        if (score === 0) break;
      }
    }
  }

  const rawMatches = bestCandidate?.matches ?? [];
  const optimizedMatches = reassignCourtIndices(
    rawMatches,
    historyRounds,
    lastRound
  );

  return {
    roundIndex: currentRoundIndex,
    matches: optimizedMatches,
    benchPlayerIds: bestCandidate?.benchPlayerIds ?? [],
  };
}

export interface ProgressiveProgress {
  current: number;
  total: number;
  roundNumber: number;
}

export interface ProgressiveGenerationOptions {
  timeBudgetMs?: number;
  onRoundStart?: (progress: ProgressiveProgress) => void;
  onRoundGenerated?: (round: Round, nextProgress: ProgressiveProgress | null) => void;
}

/**
 * Generate multiple rounds progressively, yielding each round to the UI as it completes.
 */
export async function generateMultipleRoundsProgressive(
  activePlayers: Player[],
  courtCount: number,
  historyRounds: Round[],
  allPlayers: Player[],
  startRoundIndex: number,
  count: number,
  options?: ProgressiveGenerationOptions
): Promise<Round[]> {
  const rounds: Round[] = [];
  const cumulativeHistory = [...historyRounds];
  const timeBudget = options?.timeBudgetMs ?? TIME_BUDGET_PER_ROUND_MS;

  for (let i = 0; i < count; i++) {
    const roundIndex = startRoundIndex + i;
    const current = i + 1;
    const roundNumber = roundIndex + 1;
    const currentProgress: ProgressiveProgress = { current, total: count, roundNumber };

    // 1. Notify that the first round is now being generated/evaluated
    if (i === 0) {
      options?.onRoundStart?.(currentProgress);
      // Yield control so browser paints the initial progress heading before optimization
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    // 2. Generate the round
    const round = await generateRoundAsync(
      activePlayers,
      courtCount,
      cumulativeHistory,
      allPlayers,
      roundIndex,
      timeBudget
    );
    round.roundIndex = roundIndex;

    rounds.push(round);
    cumulativeHistory.push(round);

    // 3. Compute next round progress (or null if all completed)
    const nextProgress: ProgressiveProgress | null =
      i + 1 < count
        ? {
            current: current + 1,
            total: count,
            roundNumber: roundNumber + 1,
          }
        : null;

    // 4. Notify callback with both this completed round AND nextProgress
    // This allows React to batch adding the round and advancing progress simultaneously
    options?.onRoundGenerated?.(round, nextProgress);

    // Yield control to the browser to render the newly added round and updated progress text
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return rounds;
}

/**
 * Generate multiple rounds consecutively (synchronous).
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
 * Regenerate a single round at a specific index.
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

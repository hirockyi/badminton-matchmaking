import { Match, Round } from './types';

// Helper: get all player IDs in a match
function getMatchPlayerIds(match: Match): string[] {
  return [match.team1[0], match.team1[1], match.team2[0], match.team2[1]];
}

// Generate all permutations of numbers [0, 1, ..., n-1]
function generatePermutations(n: number): number[][] {
  const result: number[][] = [];
  const current: number[] = [];
  const used: boolean[] = new Array(n).fill(false);

  function backtrack() {
    if (current.length === n) {
      result.push([...current]);
      return;
    }
    for (let i = 0; i < n; i++) {
      if (!used[i]) {
        used[i] = true;
        current.push(i);
        backtrack();
        current.pop();
        used[i] = false;
      }
    }
  }

  backtrack();
  return result;
}

/**
 * Reassign court indices for the given matches to minimize:
 * 1. Players staying on the same court in consecutive rounds.
 * 2. Peak individual imbalance (Min-Max fairness) across all players.
 * 3. Total court variance per player.
 *
 * Fully robust against mid-session court count changes and player join/leave.
 */
export function reassignCourtIndices(
  matches: Match[],
  historyRounds: Round[],
  lastRound: Round | null
): Match[] {
  const matchCount = matches.length;
  if (matchCount <= 1) {
    return matches.map((m, idx) => ({ ...m, courtIndex: idx }));
  }

  // 1. Map of player's court in immediate last round
  const lastCourtByPlayer = new Map<string, number>();
  if (lastRound && lastRound.matches) {
    for (const m of lastRound.matches) {
      for (const pid of getMatchPlayerIds(m)) {
        lastCourtByPlayer.set(pid, m.courtIndex);
      }
    }
  }

  // 2. Cumulative court counts per player for active courts [0 .. matchCount - 1]
  const courtCountsByPlayer = new Map<string, number[]>();

  for (const m of matches) {
    for (const pid of getMatchPlayerIds(m)) {
      if (!courtCountsByPlayer.has(pid)) {
        courtCountsByPlayer.set(pid, new Array(matchCount).fill(0));
      }
    }
  }

  for (const round of historyRounds) {
    for (const m of round.matches) {
      if (m.courtIndex >= 0 && m.courtIndex < matchCount) {
        for (const pid of getMatchPlayerIds(m)) {
          const counts = courtCountsByPlayer.get(pid);
          if (counts) {
            counts[m.courtIndex]++;
          }
        }
      }
    }
  }

  // Generate all permutations of court indices [0, 1, ..., matchCount - 1]
  const permutations = generatePermutations(matchCount);

  let bestPerms: number[][] = [];
  let bestScore = Infinity;

  for (const perm of permutations) {
    let totalPenalty = 0;
    let maxIndividualImbalance = 0;

    for (let mIdx = 0; mIdx < matchCount; mIdx++) {
      const assignedCourt = perm[mIdx];
      const playerIds = getMatchPlayerIds(matches[mIdx]);

      for (const pid of playerIds) {
        // Factor 1: Immediate consecutive court penalty
        if (lastCourtByPlayer.get(pid) === assignedCourt) {
          totalPenalty += 100;
        }

        // Factor 2: Min-Max fairness & individual court imbalance
        const counts = courtCountsByPlayer.get(pid)!;
        const newCounts = counts.map((c, idx) => (idx === assignedCourt ? c + 1 : c));

        const maxCount = Math.max(...newCounts);
        const minCount = Math.min(...newCounts);
        const imbalance = maxCount - minCount;

        if (imbalance > maxIndividualImbalance) {
          maxIndividualImbalance = imbalance;
        }

        totalPenalty += Math.pow(imbalance, 2) * 10;
      }
    }

    // Combined score: heavily prioritize minimizing the maximum individual imbalance (Min-Max fairness)
    const combinedScore = maxIndividualImbalance * 1000 + totalPenalty;


    if (combinedScore < bestScore - 1e-6) {
      bestScore = combinedScore;
      bestPerms = [perm];
    } else if (Math.abs(combinedScore - bestScore) <= 1e-6) {
      bestPerms.push(perm);
    }
  }

  // Break remaining ties randomly to avoid deterministic bias
  const bestPerm = bestPerms[Math.floor(Math.random() * bestPerms.length)];

  // Apply best permutation
  const reassignedMatches: Match[] = matches.map((m, mIdx) => ({
    ...m,
    courtIndex: bestPerm[mIdx],
  }));

  reassignedMatches.sort((a, b) => a.courtIndex - b.courtIndex);

  return reassignedMatches;
}

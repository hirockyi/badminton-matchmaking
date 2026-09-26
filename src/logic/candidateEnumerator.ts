import { Match, Player, RoundCandidate } from './types';
import { PLAYERS_PER_COURT } from './constants';

/**
 * Calculate total combination count S(N, C) for placing N players into C courts.
 * S(N, C) = _nC_(4c) * ( (4c)! / ( (4!)^c * c! ) ) * (3^c)
 */
export function calculateTotalCombinations(n: number, c: number): number {
  const totalSlots = c * PLAYERS_PER_COURT;
  if (n < totalSlots) return 0;
  if (c === 0) return 0;

  // Combination n_C_k
  function nCr(n: number, r: number): number {
    if (r < 0 || r > n) return 0;
    if (r === 0 || r === n) return 1;
    let res = 1;
    for (let i = 1; i <= r; i++) {
      res = (res * (n - i + 1)) / i;
    }
    return res;
  }

  const choosePlayers = nCr(n, totalSlots);

  if (c === 1) {
    // 4 players in 1 court: 3 pairings (AB-CD, AC-BD, AD-BC)
    return choosePlayers * 3;
  }

  if (c === 2) {
    // 8 players in 2 courts: 8! / (24 * 24 * 2) * 9 = 35 * 9 = 315
    return choosePlayers * 315;
  }

  // General formula for c >= 3 is very large (> 150,000)
  return choosePlayers * 155925;
}

/**
 * Generate 3 possible match pairings from 4 players [p0, p1, p2, p3].
 */
function createCourtPairings(courtIndex: number, p: string[]): Match[] {
  return [
    { courtIndex, team1: [p[0], p[1]], team2: [p[2], p[3]] },
    { courtIndex, team1: [p[0], p[2]], team2: [p[1], p[3]] },
    { courtIndex, team1: [p[0], p[3]], team2: [p[1], p[2]] },
  ];
}

/**
 * Enumerate all possible combination candidates for small-scale matches.
 * Returns null if the combination count exceeds maxCombinations.
 */
export function enumerateAllCandidates(
  activePlayers: Player[],
  courtCount: number,
  maxCombinations: number = 1200
): RoundCandidate[] | null {
  const n = activePlayers.length;
  const totalSlots = courtCount * PLAYERS_PER_COURT;
  if (n < totalSlots || courtCount <= 0) return null;

  const total = calculateTotalCombinations(n, courtCount);
  if (total > maxCombinations) return null;

  const playerIds = activePlayers.map((p) => p.id);
  const candidates: RoundCandidate[] = [];

  // Helper to get combinations of k elements from array
  function combinations<T>(arr: T[], k: number): T[][] {
    const res: T[][] = [];
    function backtrack(start: number, cur: T[]) {
      if (cur.length === k) {
        res.push([...cur]);
        return;
      }
      for (let i = start; i < arr.length; i++) {
        cur.push(arr[i]);
        backtrack(i + 1, cur);
        cur.pop();
      }
    }
    backtrack(0, []);
    return res;
  }

  if (courtCount === 1) {
    // 1 Court: choose 4 players, 3 pairings each
    const groupsOf4 = combinations(playerIds, 4);
    for (const group of groupsOf4) {
      const playingSet = new Set(group);
      const benched = playerIds.filter((id) => !playingSet.has(id));
      const pairings = createCourtPairings(0, group);
      for (const m of pairings) {
        candidates.push({
          matches: [m],
          benchPlayerIds: benched,
          score: 0,
        });
      }
    }
    return candidates;
  }

  if (courtCount === 2) {
    // 2 Courts: choose 8 players
    const groupsOf8 = combinations(playerIds, 8);
    for (const group of groupsOf8) {
      const playingSet = new Set(group);
      const benched = playerIds.filter((id) => !playingSet.has(id));

      // Partition 8 players into 2 groups of 4 (court 0 and court 1)
      // Fix first player in group to court 0 to avoid symmetry duplicate (8_C_4 / 2 = 35)
      const first = group[0];
      const rest = group.slice(1);
      const court0Others = combinations(rest, 3);

      for (const others of court0Others) {
        const court0 = [first, ...others];
        const c0Set = new Set(court0);
        const court1 = group.filter((id) => !c0Set.has(id));

        const pairingsC0 = createCourtPairings(0, court0);
        const pairingsC1 = createCourtPairings(1, court1);

        for (const m0 of pairingsC0) {
          for (const m1 of pairingsC1) {
            candidates.push({
              matches: [m0, m1],
              benchPlayerIds: benched,
              score: 0,
            });
          }
        }
      }
    }
    return candidates;
  }

  return null;
}

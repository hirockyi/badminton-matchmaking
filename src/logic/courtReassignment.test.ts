import { describe, it, expect } from 'vitest';
import { reassignCourtIndices } from './courtReassignment';
import { Match, Round } from './types';

function makeMatch(courtIndex: number, p1: string, p2: string, p3: string, p4: string): Match {
  return {
    courtIndex,
    team1: [p1, p2],
    team2: [p3, p4],
  };
}

function makeRound(index: number, matches: Match[], bench: string[] = []): Round {
  return {
    roundIndex: index,
    matches,
    benchPlayerIds: bench,
  };
}

describe('reassignCourtIndices', () => {
  it('handles single court without errors', () => {
    const matches = [makeMatch(0, 'p1', 'p2', 'p3', 'p4')];
    const result = reassignCourtIndices(matches, [], null);
    expect(result).toHaveLength(1);
    expect(result[0].courtIndex).toBe(0);
  });

  it('swaps courts to prevent players from staying on the same court as last round', () => {
    // Round 0:
    // Court 0: p1, p2, p3, p4
    // Court 1: p5, p6, p7, p8
    const round0 = makeRound(0, [
      makeMatch(0, 'p1', 'p2', 'p3', 'p4'),
      makeMatch(1, 'p5', 'p6', 'p7', 'p8'),
    ]);

    // Round 1 (new candidate generated before reassignment):
    // Match A (originally court 0): p1, p2, p3, p4 (same group)
    // Match B (originally court 1): p5, p6, p7, p8
    const candidateMatches = [
      makeMatch(0, 'p1', 'p2', 'p3', 'p4'),
      makeMatch(1, 'p5', 'p6', 'p7', 'p8'),
    ];

    const reassigned = reassignCourtIndices(candidateMatches, [round0], round0);

    // After reassignment, p1..p4 should be on Court 1, and p5..p8 should be on Court 0!
    const court0Players = new Set([...reassigned[0].team1, ...reassigned[0].team2]);
    const court1Players = new Set([...reassigned[1].team1, ...reassigned[1].team2]);

    expect(reassigned[0].courtIndex).toBe(0);
    expect(reassigned[1].courtIndex).toBe(1);

    expect(court0Players.has('p5')).toBe(true);
    expect(court0Players.has('p1')).toBe(false);

    expect(court1Players.has('p1')).toBe(true);
    expect(court1Players.has('p5')).toBe(false);
  });

  it('balances cumulative court usage when there is an imbalance', () => {
    // History: p1..p4 have played on Court 0 twice, and Court 1 zero times
    const round0 = makeRound(0, [makeMatch(0, 'p1', 'p2', 'p3', 'p4'), makeMatch(1, 'p5', 'p6', 'p7', 'p8')]);
    const round1 = makeRound(1, [makeMatch(0, 'p1', 'p2', 'p3', 'p4'), makeMatch(1, 'p5', 'p6', 'p7', 'p8')]);

    // Current candidate: Match A has p1..p4, Match B has p5..p8
    const candidateMatches = [
      makeMatch(0, 'p1', 'p2', 'p3', 'p4'),
      makeMatch(1, 'p5', 'p6', 'p7', 'p8'),
    ];

    const reassigned = reassignCourtIndices(candidateMatches, [round0, round1], round1);

    const court1Players = new Set([...reassigned[1].team1, ...reassigned[1].team2]);
    expect(court1Players.has('p1')).toBe(true); // p1..p4 moved to Court 1
  });

  it('handles mid-session court count change gracefully (e.g. 1 court -> 2 courts)', () => {
    // Round 0 only had 1 court
    const round0 = makeRound(0, [makeMatch(0, 'p1', 'p2', 'p3', 'p4')]);

    // Round 1 now has 2 courts
    const candidateMatches = [
      makeMatch(0, 'p1', 'p2', 'p5', 'p6'), // contains p1, p2 from court 0
      makeMatch(1, 'p3', 'p4', 'p7', 'p8'), // contains p3, p4 from court 0
    ];

    const reassigned = reassignCourtIndices(candidateMatches, [round0], round0);
    expect(reassigned).toHaveLength(2);
    expect(reassigned[0].courtIndex).toBe(0);
    expect(reassigned[1].courtIndex).toBe(1);
  });

  it('handles mid-session court count decrease gracefully (e.g. 3 courts -> 2 courts)', () => {
    // Round 0 had 3 courts (courts 0, 1, 2)
    const round0 = makeRound(0, [
      makeMatch(0, 'p1', 'p2', 'p3', 'p4'),
      makeMatch(1, 'p5', 'p6', 'p7', 'p8'),
      makeMatch(2, 'p9', 'p10', 'p11', 'p12'),
    ]);

    // Round 1 reduced to 2 courts
    const candidateMatches = [
      makeMatch(0, 'p1', 'p2', 'p5', 'p6'),
      makeMatch(1, 'p9', 'p10', 'p7', 'p8'),
    ];

    const reassigned = reassignCourtIndices(candidateMatches, [round0], round0);
    expect(reassigned).toHaveLength(2);
    expect(reassigned[0].courtIndex).toBe(0);
    expect(reassigned[1].courtIndex).toBe(1);
  });
});

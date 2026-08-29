import { describe, it, expect } from 'vitest';
import {
  calcPairDuplicationPenalty,
  calcOpponentDuplicationPenalty,
  calcConsecutivePlayPenalty,
  calcConsecutiveRestPenalty,
  calcPlayCountFairnessPenalty,
  calcStaminaFitPenalty,
  scoreCandidate,
} from './scoring';
import { Player, Round, RoundCandidate } from './types';

// --- Helper factories ---

function makePlayer(id: string, overrides?: Partial<Player>): Player {
  return {
    id,
    name: id,
    active: true,
    joinedAtRound: 0,
    stamina: 5,
    ...overrides,
  };
}

function makeRound(index: number, matches: Round['matches'], bench: string[] = []): Round {
  return {
    roundIndex: index,
    matches,
    benchPlayerIds: bench,
    status: 'confirmed',
  };
}

function makeCandidate(matches: RoundCandidate['matches'], bench: string[] = []): RoundCandidate {
  return { matches, benchPlayerIds: bench, score: 0 };
}

// --- Tests ---

describe('calcPairDuplicationPenalty', () => {
  it('returns 0 when no history', () => {
    const candidate = makeCandidate([
      { courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] },
    ]);
    expect(calcPairDuplicationPenalty(candidate, [])).toBe(0);
  });

  it('penalizes repeated pairs', () => {
    const history = [
      makeRound(0, [{ courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] }]),
    ];
    // Same pairs a-b and c-d again
    const candidate = makeCandidate([
      { courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] },
    ]);
    const penalty = calcPairDuplicationPenalty(candidate, history);
    expect(penalty).toBeGreaterThan(0);
  });

  it('does not penalize new pairs', () => {
    const history = [
      makeRound(0, [{ courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] }]),
    ];
    // New pairs: a-c and b-d
    const candidate = makeCandidate([
      { courtIndex: 0, team1: ['a', 'c'], team2: ['b', 'd'] },
    ]);
    const penalty = calcPairDuplicationPenalty(candidate, history);
    expect(penalty).toBe(0);
  });
});

describe('calcOpponentDuplicationPenalty', () => {
  it('returns 0 when no history', () => {
    const candidate = makeCandidate([
      { courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] },
    ]);
    expect(calcOpponentDuplicationPenalty(candidate, [])).toBe(0);
  });

  it('penalizes repeated opponent matchups', () => {
    const history = [
      makeRound(0, [{ courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] }]),
    ];
    // Same matchup: a,b vs c,d → opponents are a-c, a-d, b-c, b-d
    const candidate = makeCandidate([
      { courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] },
    ]);
    const penalty = calcOpponentDuplicationPenalty(candidate, history);
    expect(penalty).toBe(4); // 4 opponent pairs repeated once each
  });
});

describe('calcConsecutivePlayPenalty', () => {
  it('returns 0 when no last round', () => {
    const candidate = makeCandidate([
      { courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] },
    ]);
    expect(calcConsecutivePlayPenalty(candidate, null)).toBe(0);
  });

  it('penalizes players who played in the previous round', () => {
    const lastRound = makeRound(0, [
      { courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] },
    ]);
    // a and b play again, e and f are new
    const candidate = makeCandidate([
      { courtIndex: 0, team1: ['a', 'b'], team2: ['e', 'f'] },
    ]);
    expect(calcConsecutivePlayPenalty(candidate, lastRound)).toBe(2);
  });

  it('returns 0 when completely different players', () => {
    const lastRound = makeRound(0, [
      { courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] },
    ]);
    const candidate = makeCandidate([
      { courtIndex: 0, team1: ['e', 'f'], team2: ['g', 'h'] },
    ]);
    expect(calcConsecutivePlayPenalty(candidate, lastRound)).toBe(0);
  });
});

describe('calcConsecutiveRestPenalty', () => {
  it('returns 0 when no last round', () => {
    const candidate = makeCandidate(
      [{ courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] }],
      ['e']
    );
    expect(calcConsecutiveRestPenalty(candidate, null)).toBe(0);
  });

  it('penalizes players who rested consecutively', () => {
    const lastRound = makeRound(
      0,
      [{ courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] }],
      ['e', 'f']
    );
    // e rests again
    const candidate = makeCandidate(
      [{ courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] }],
      ['e', 'g']
    );
    expect(calcConsecutiveRestPenalty(candidate, lastRound)).toBe(1);
  });
});

describe('calcPlayCountFairnessPenalty', () => {
  it('returns 0 when all players have equal play rates', () => {
    const players = ['a', 'b', 'c', 'd'].map(id => makePlayer(id));
    // All played in round 0
    const history = [
      makeRound(0, [{ courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] }]),
    ];
    // All play again
    const candidate = makeCandidate([
      { courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] },
    ]);
    const penalty = calcPlayCountFairnessPenalty(candidate, history, players, 1);
    expect(penalty).toBe(0);
  });

  it('penalizes uneven play rates', () => {
    const players = ['a', 'b', 'c', 'd', 'e'].map(id => makePlayer(id));
    // a,b,c,d played; e was benched
    const history = [
      makeRound(0, [{ courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] }]),
    ];
    // a,b,c,d play again; e benched again → a,b,c,d have 100%, e has 0%
    const candidate = makeCandidate(
      [{ courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] }],
      ['e']
    );
    const penalty = calcPlayCountFairnessPenalty(candidate, history, players, 1);
    expect(penalty).toBeGreaterThan(0);
  });

  it('considers joinedAtRound for fairness', () => {
    const players = [
      makePlayer('a', { joinedAtRound: 0 }),
      makePlayer('b', { joinedAtRound: 0 }),
      makePlayer('c', { joinedAtRound: 0 }),
      makePlayer('d', { joinedAtRound: 0 }),
      makePlayer('e', { joinedAtRound: 5 }), // Joined late
    ];
    // e joined at round 5 so has only been available for 1 round (round 5)
    const history: Round[] = [];
    // Everyone plays in round 5
    const candidate = makeCandidate([
      { courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'e'] },
    ]);
    // a,b,c have 1/6 play rate; e has 1/1 play rate
    // But the penalty should be calculated correctly considering joinedAtRound
    const penalty = calcPlayCountFairnessPenalty(candidate, history, players, 5);
    expect(penalty).toBeGreaterThan(0); // There IS a difference in rates
  });
});

describe('calcStaminaFitPenalty', () => {
  it('returns 0 when player with stamina 5 plays every round', () => {
    const players = ['a', 'b', 'c', 'd'].map(id => makePlayer(id, { stamina: 5 }));
    const history = [
      makeRound(0, [{ courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] }]),
    ];
    const candidate = makeCandidate([
      { courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] },
    ]);
    const penalty = calcStaminaFitPenalty(candidate, history, players, 1);
    expect(penalty).toBe(0);
  });

  it('penalizes when low-stamina player plays too much', () => {
    const players = [
      makePlayer('a', { stamina: 1 }), // target 60%
      makePlayer('b', { stamina: 5 }),
      makePlayer('c', { stamina: 5 }),
      makePlayer('d', { stamina: 5 }),
    ];
    // All played every round → player a at 100% but target is 60%
    const history = [
      makeRound(0, [{ courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] }]),
      makeRound(1, [{ courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] }]),
    ];
    const candidate = makeCandidate([
      { courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] },
    ]);
    const penalty = calcStaminaFitPenalty(candidate, history, players, 2);
    expect(penalty).toBeGreaterThan(0);
  });
});

describe('scoreCandidate', () => {
  it('returns a number', () => {
    const players = ['a', 'b', 'c', 'd'].map(id => makePlayer(id));
    const candidate = makeCandidate([
      { courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] },
    ]);
    const score = scoreCandidate(candidate, [], players, 0, null);
    expect(typeof score).toBe('number');
  });

  it('prefers candidates with less duplication', () => {
    const players = ['a', 'b', 'c', 'd'].map(id => makePlayer(id));
    const history = [
      makeRound(0, [{ courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] }]),
    ];

    // Candidate 1: same pairs as history (bad)
    const candidate1 = makeCandidate([
      { courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] },
    ]);

    // Candidate 2: different pairs (good)
    const candidate2 = makeCandidate([
      { courtIndex: 0, team1: ['a', 'c'], team2: ['b', 'd'] },
    ]);

    const score1 = scoreCandidate(candidate1, history, players, 1, history[0]);
    const score2 = scoreCandidate(candidate2, history, players, 1, history[0]);

    expect(score2).toBeGreaterThan(score1);
  });
});

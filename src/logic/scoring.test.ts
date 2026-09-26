import { describe, it, expect } from 'vitest';
import {
  calcPairDuplicationPenalty,
  calcOpponentDuplicationPenalty,
  calcConsecutivePlayPenalty,
  calcConsecutiveRestPenalty,
  calcDynamicTargetPlayRates,
  calcDynamicDecayRates,
  calcPlayCountDeviationPenalty,
  calcMaxMinSpreadPenalty,
  scoreCandidate,
} from './scoring';
import { Player, Round, RoundCandidate, StaminaLevel } from './types';

function makePlayer(id: string, stamina: StaminaLevel = 3, overrides?: Partial<Player>): Player {
  return {
    id,
    name: id,
    active: true,
    joinedAtRound: 0,
    stamina,
    ...overrides,
  };
}

function makeRound(index: number, matches: Round['matches'], bench: string[] = []): Round {
  return {
    roundIndex: index,
    matches,
    benchPlayerIds: bench,
  };
}

function makeCandidate(matches: RoundCandidate['matches'], bench: string[] = []): RoundCandidate {
  return { matches, benchPlayerIds: bench, score: 0 };
}

describe('calcDynamicDecayRates', () => {
  it('calculates higher decay retention for larger player-to-court ratios (longer cycle)', () => {
    const { pairDecayRate: decay1C8P } = calcDynamicDecayRates(8, 1);
    const { pairDecayRate: decay2C8P } = calcDynamicDecayRates(8, 2);
    const { pairDecayRate: decay1C5P } = calcDynamicDecayRates(5, 1);

    expect(decay1C8P).toBeGreaterThan(decay2C8P);
    expect(decay2C8P).toBeGreaterThan(decay1C5P);
    expect(decay1C8P).toBeCloseTo(0.95, 1);
  });
});

describe('calcDynamicTargetPlayRates', () => {
  it('calculates equal rates when all players have stamina 3', () => {
    const players = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => makePlayer(id, 3));
    const rates = calcDynamicTargetPlayRates(players, 1);
    expect(rates.get('a')).toBeCloseTo(4 / 6, 2);
    expect(rates.get('f')).toBeCloseTo(4 / 6, 2);
  });

  it('scales target play rates according to stamina', () => {
    const players = [
      makePlayer('p_low', 1),
      makePlayer('p_mid1', 3),
      makePlayer('p_mid2', 3),
      makePlayer('p_mid3', 3),
      makePlayer('p_mid4', 3),
      makePlayer('p_high', 5),
    ];
    const rates = calcDynamicTargetPlayRates(players, 1);
    const lowRate = rates.get('p_low')!;
    const midRate = rates.get('p_mid1')!;
    const highRate = rates.get('p_high')!;

    expect(highRate).toBeGreaterThan(midRate);
    expect(midRate).toBeGreaterThan(lowRate);
  });
});

describe('calcPlayCountDeviationPenalty', () => {
  it('penalizes deviation from absolute target match count without dilution', () => {
    const players = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => makePlayer(id, 3));
    // Candidate playing a, b, c, d (e, f on bench)
    const candidate = makeCandidate([
      { courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] },
    ], ['e', 'f']);

    const penalty = calcPlayCountDeviationPenalty(candidate, [], players, 0, 1);
    expect(penalty).toBeGreaterThan(0);
  });
});

describe('calcMaxMinSpreadPenalty', () => {
  it('returns 0 when spread is <= 1 among same stamina players', () => {
    const players = ['a', 'b', 'c', 'd', 'e'].map((id) => makePlayer(id, 3));
    // All have played 1 match, one will have played 2
    const round0 = makeRound(0, [{ courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] }], ['e']);
    // Candidate puts e in the game -> e will have played 1, others 1 or 2 (spread = 1)
    const candidate = makeCandidate([
      { courtIndex: 0, team1: ['e', 'b'], team2: ['c', 'd'] },
    ], ['a']);

    const penalty = calcMaxMinSpreadPenalty(candidate, [round0], players);
    expect(penalty).toBe(0);
  });

  it('penalizes heavily when spread is >= 2', () => {
    const players = ['a', 'b', 'c', 'd', 'e'].map((id) => makePlayer(id, 3));
    // Round 0 and 1: 'e' benched both times! So a,b,c,d played 2, e played 0.
    const round0 = makeRound(0, [{ courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] }], ['e']);
    const round1 = makeRound(1, [{ courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] }], ['e']);

    // Bad candidate: benches 'e' a 3rd time! (a,b,c,d will be 3, e will be 0 -> diff=3)
    const badCandidate = makeCandidate([
      { courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] },
    ], ['e']);

    // Good candidate: plays 'e'! (a,b,c will be 3, d will be 2, e will be 1 -> diff=2)
    const betterCandidate = makeCandidate([
      { courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'e'] },
    ], ['d']);

    const badPenalty = calcMaxMinSpreadPenalty(badCandidate, [round0, round1], players);
    const betterPenalty = calcMaxMinSpreadPenalty(betterCandidate, [round0, round1], players);

    // Bad candidate (diff = 3): (3 - 1)^2 = 4
    expect(badPenalty).toBe(4);
    // Better candidate (diff = 2): (2 - 1)^2 = 1
    expect(betterPenalty).toBe(1);
    expect(badPenalty).toBeGreaterThan(betterPenalty);
  });
});

describe('calcPairDuplicationPenalty with recency decay', () => {
  it('returns 0 when no history', () => {
    const candidate = makeCandidate([
      { courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] },
    ]);
    expect(calcPairDuplicationPenalty(candidate, [], 0)).toBe(0);
  });

  it('weights recent pairings heavier than older pairings due to decay', () => {
    const oldHistory = [
      makeRound(0, [{ courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] }]),
    ];
    const recentHistory = [
      makeRound(4, [{ courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] }]),
    ];

    const candidate = makeCandidate([
      { courtIndex: 0, team1: ['a', 'b'], team2: ['e', 'f'] },
    ]);

    const oldPenalty = calcPairDuplicationPenalty(candidate, oldHistory, 5, 0.8);
    const recentPenalty = calcPairDuplicationPenalty(candidate, recentHistory, 5, 0.8);

    expect(recentPenalty).toBeGreaterThan(oldPenalty);
    expect(recentPenalty).toBeCloseTo(1.0, 2);
    expect(oldPenalty).toBeCloseTo(Math.pow(0.8, 4), 2);
  });
});

describe('calcOpponentDuplicationPenalty with recency decay', () => {
  it('weights recent opponent matchups heavier than older matchups', () => {
    const oldHistory = [
      makeRound(0, [{ courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] }]),
    ];
    const recentHistory = [
      makeRound(4, [{ courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] }]),
    ];

    const candidate = makeCandidate([
      { courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] },
    ]);

    const oldPenalty = calcOpponentDuplicationPenalty(candidate, oldHistory, 5, 0.8);
    const recentPenalty = calcOpponentDuplicationPenalty(candidate, recentHistory, 5, 0.8);

    expect(recentPenalty).toBeGreaterThan(oldPenalty);
  });
});

describe('calcConsecutivePlayPenalty', () => {
  it('heavily penalizes stamina 1 for playing back-to-back', () => {
    const p1 = makePlayer('p1', 1);
    const p5 = makePlayer('p5', 5);
    const playersById = new Map([['p1', p1], ['p5', p5]]);

    const lastRound = makeRound(0, [
      { courtIndex: 0, team1: ['p1', 'p5'], team2: ['c', 'd'] },
    ]);

    const candP1 = makeCandidate([
      { courtIndex: 0, team1: ['p1', 'x'], team2: ['y', 'z'] },
    ]);
    const candP5 = makeCandidate([
      { courtIndex: 0, team1: ['p5', 'x'], team2: ['y', 'z'] },
    ]);

    const penaltyP1 = calcConsecutivePlayPenalty(candP1, lastRound, playersById);
    const penaltyP5 = calcConsecutivePlayPenalty(candP5, lastRound, playersById);

    expect(penaltyP1).toBe(5.0);
    expect(penaltyP5).toBe(0.0);
  });
});

describe('calcConsecutiveRestPenalty', () => {
  it('heavily penalizes stamina 5 for resting back-to-back', () => {
    const p1 = makePlayer('p1', 1);
    const p5 = makePlayer('p5', 5);
    const playersById = new Map([['p1', p1], ['p5', p5]]);

    const lastRound = makeRound(
      0,
      [{ courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] }],
      ['p1', 'p5']
    );

    const candP1Benched = makeCandidate(
      [{ courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] }],
      ['p1']
    );
    const candP5Benched = makeCandidate(
      [{ courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] }],
      ['p5']
    );

    const penaltyP1 = calcConsecutiveRestPenalty(candP1Benched, lastRound, playersById);
    const penaltyP5 = calcConsecutiveRestPenalty(candP5Benched, lastRound, playersById);

    expect(penaltyP1).toBe(0.0);
    expect(penaltyP5).toBe(4.0);
  });
});

describe('scoreCandidate', () => {
  it('returns valid score with dynamic decay and play count fairness applied', () => {
    const players = [
      makePlayer('a', 5),
      makePlayer('b', 3),
      makePlayer('c', 3),
      makePlayer('d', 3),
      makePlayer('e', 1),
    ];
    const candidate = makeCandidate(
      [{ courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] }],
      ['e']
    );
    const score = scoreCandidate(candidate, [], players, players, 0, null, 1);
    expect(typeof score).toBe('number');
  });
});

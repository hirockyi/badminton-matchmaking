import { describe, it, expect } from 'vitest';
import {
  calcPairDuplicationPenalty,
  calcOpponentDuplicationPenalty,
  calcConsecutivePlayPenalty,
  calcConsecutiveRestPenalty,
  calcDynamicTargetPlayRates,
  calcStaminaFitPenalty,
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

describe('calcPairDuplicationPenalty with recency decay', () => {
  it('returns 0 when no history', () => {
    const candidate = makeCandidate([
      { courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] },
    ]);
    expect(calcPairDuplicationPenalty(candidate, [], 0)).toBe(0);
  });

  it('weights recent pairings heavier than older pairings due to decay', () => {
    // Round 0: a and b paired (5 rounds ago)
    const oldHistory = [
      makeRound(0, [{ courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] }]),
    ];
    // Round 4: a and b paired (1 round ago)
    const recentHistory = [
      makeRound(4, [{ courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] }]),
    ];

    const candidate = makeCandidate([
      { courtIndex: 0, team1: ['a', 'b'], team2: ['e', 'f'] },
    ]);

    const oldPenalty = calcPairDuplicationPenalty(candidate, oldHistory, 5);
    const recentPenalty = calcPairDuplicationPenalty(candidate, recentHistory, 5);

    // Recent pairing should carry substantially higher penalty than old pairing
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

    const oldPenalty = calcOpponentDuplicationPenalty(candidate, oldHistory, 5);
    const recentPenalty = calcOpponentDuplicationPenalty(candidate, recentHistory, 5);

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
  it('returns valid score with decay applied', () => {
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

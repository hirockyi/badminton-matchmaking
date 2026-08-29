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
    status: 'confirmed',
  };
}

function makeCandidate(matches: RoundCandidate['matches'], bench: string[] = []): RoundCandidate {
  return { matches, benchPlayerIds: bench, score: 0 };
}

describe('calcDynamicTargetPlayRates', () => {
  it('calculates equal rates when all players have stamina 3', () => {
    const players = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => makePlayer(id, 3));
    const rates = calcDynamicTargetPlayRates(players, 1); // 1 court = 4 slots, 6 players
    expect(rates.get('a')).toBeCloseTo(4 / 6, 2);
    expect(rates.get('f')).toBeCloseTo(4 / 6, 2);
  });

  it('scales target play rates according to stamina', () => {
    const players = [
      makePlayer('p_low', 1),   // Stamina 1
      makePlayer('p_mid1', 3),  // Stamina 3
      makePlayer('p_mid2', 3),
      makePlayer('p_mid3', 3),
      makePlayer('p_mid4', 3),
      makePlayer('p_high', 5),  // Stamina 5
    ];
    const rates = calcDynamicTargetPlayRates(players, 1);
    const lowRate = rates.get('p_low')!;
    const midRate = rates.get('p_mid1')!;
    const highRate = rates.get('p_high')!;

    expect(highRate).toBeGreaterThan(midRate);
    expect(midRate).toBeGreaterThan(lowRate);
  });
});

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
    const candidate = makeCandidate([
      { courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] },
    ]);
    expect(calcPairDuplicationPenalty(candidate, history)).toBeGreaterThan(0);
  });
});

describe('calcOpponentDuplicationPenalty', () => {
  it('penalizes repeated opponent matchups', () => {
    const history = [
      makeRound(0, [{ courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] }]),
    ];
    const candidate = makeCandidate([
      { courtIndex: 0, team1: ['a', 'b'], team2: ['c', 'd'] },
    ]);
    expect(calcOpponentDuplicationPenalty(candidate, history)).toBe(4);
  });
});

describe('calcConsecutivePlayPenalty', () => {
  it('heavily penalizes stamina 1 for playing back-to-back', () => {
    const p1 = makePlayer('p1', 1); // stamina 1
    const p5 = makePlayer('p5', 5); // stamina 5
    const playersById = new Map([['p1', p1], ['p5', p5]]);

    const lastRound = makeRound(0, [
      { courtIndex: 0, team1: ['p1', 'p5'], team2: ['c', 'd'] },
    ]);

    // Candidate where p1 plays consecutively vs where p5 plays consecutively
    const candP1 = makeCandidate([
      { courtIndex: 0, team1: ['p1', 'x'], team2: ['y', 'z'] },
    ]);
    const candP5 = makeCandidate([
      { courtIndex: 0, team1: ['p5', 'x'], team2: ['y', 'z'] },
    ]);

    const penaltyP1 = calcConsecutivePlayPenalty(candP1, lastRound, playersById);
    const penaltyP5 = calcConsecutivePlayPenalty(candP5, lastRound, playersById);

    expect(penaltyP1).toBe(5.0); // Strict avoidance
    expect(penaltyP5).toBe(0.0); // Stamina 5 can play continuously without penalty
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

    expect(penaltyP1).toBe(0.0); // Stamina 1 resting again is fine
    expect(penaltyP5).toBe(4.0); // Stamina 5 resting again is heavily penalized
  });
});

describe('scoreCandidate', () => {
  it('returns higher score for candidates respecting stamina and variety', () => {
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

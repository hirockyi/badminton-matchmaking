import { describe, it, expect } from 'vitest';
import { generateRound, generateMultipleRounds, regenerateRound } from './matchGenerator';
import { Player, Round } from './types';
import { PLAYERS_PER_COURT } from './constants';

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

describe('generateRound', () => {
  it('generates a valid round with 4 players and 1 court', () => {
    const players = ['a', 'b', 'c', 'd'].map(id => makePlayer(id));
    const round = generateRound(players, 1, [], players, 0);

    expect(round.roundIndex).toBe(0);
    expect(round.status).toBe('pending');
    expect(round.matches).toHaveLength(1);
    expect(round.benchPlayerIds).toHaveLength(0);

    // All 4 players should be playing
    const playingIds = new Set([
      ...round.matches[0].team1,
      ...round.matches[0].team2,
    ]);
    expect(playingIds.size).toBe(4);
    for (const p of players) {
      expect(playingIds.has(p.id)).toBe(true);
    }
  });

  it('generates a valid round with 8 players and 2 courts', () => {
    const players = Array.from({ length: 8 }, (_, i) => makePlayer(`p${i}`));
    const round = generateRound(players, 2, [], players, 0);

    expect(round.matches).toHaveLength(2);
    expect(round.benchPlayerIds).toHaveLength(0);

    // All 8 players should be playing
    const playingIds = new Set<string>();
    for (const m of round.matches) {
      m.team1.forEach(id => playingIds.add(id));
      m.team2.forEach(id => playingIds.add(id));
    }
    expect(playingIds.size).toBe(8);
  });

  it('benches players when there are more than court slots', () => {
    const players = Array.from({ length: 5 }, (_, i) => makePlayer(`p${i}`));
    const round = generateRound(players, 1, [], players, 0);

    expect(round.matches).toHaveLength(1);
    expect(round.benchPlayerIds).toHaveLength(1);

    // 4 playing + 1 benched = 5
    const playingIds = new Set([
      ...round.matches[0].team1,
      ...round.matches[0].team2,
    ]);
    expect(playingIds.size).toBe(4);
    expect(round.benchPlayerIds.every(id => !playingIds.has(id))).toBe(true);
  });

  it('returns empty matches when not enough players', () => {
    const players = [makePlayer('a'), makePlayer('b'), makePlayer('c')];
    const round = generateRound(players, 1, [], players, 0);

    expect(round.matches).toHaveLength(0);
    expect(round.benchPlayerIds).toHaveLength(3);
  });

  it('adjusts court count down if not enough players', () => {
    const players = Array.from({ length: 5 }, (_, i) => makePlayer(`p${i}`));
    // Request 2 courts but only 5 players → should use 1 court
    const round = generateRound(players, 2, [], players, 0);

    expect(round.matches).toHaveLength(1);
    expect(round.benchPlayerIds).toHaveLength(1);
  });
});

describe('generateMultipleRounds', () => {
  it('generates the requested number of rounds', () => {
    const players = Array.from({ length: 6 }, (_, i) => makePlayer(`p${i}`));
    const rounds = generateMultipleRounds(players, 1, [], players, 0, 5);

    expect(rounds).toHaveLength(5);
    rounds.forEach((round, i) => {
      expect(round.roundIndex).toBe(i);
      expect(round.status).toBe('pending');
    });
  });

  it('generates rounds that consider previous lookahead rounds', () => {
    const players = Array.from({ length: 6 }, (_, i) => makePlayer(`p${i}`));
    const rounds = generateMultipleRounds(players, 1, [], players, 0, 3);

    // Each round should be valid
    for (const round of rounds) {
      expect(round.matches).toHaveLength(1);
      const playingCount = round.matches[0].team1.length + round.matches[0].team2.length;
      expect(playingCount).toBe(PLAYERS_PER_COURT);
    }
  });
});

describe('regenerateRound', () => {
  it('generates a new round at the specified index', () => {
    const players = Array.from({ length: 6 }, (_, i) => makePlayer(`p${i}`));
    const confirmed: Round[] = [];
    const pendingBefore: Round[] = [];

    const round = regenerateRound(players, 1, confirmed, pendingBefore, players, 3);

    expect(round.roundIndex).toBe(3);
    expect(round.status).toBe('pending');
    expect(round.matches).toHaveLength(1);
  });

  it('considers pending rounds before the target as virtual history', () => {
    const players = Array.from({ length: 6 }, (_, i) => makePlayer(`p${i}`));
    const pendingBefore: Round[] = [
      {
        roundIndex: 0,
        matches: [{ courtIndex: 0, team1: ['p0', 'p1'], team2: ['p2', 'p3'] }],
        benchPlayerIds: ['p4', 'p5'],
        status: 'pending',
      },
    ];

    const round = regenerateRound(players, 1, [], pendingBefore, players, 1);

    expect(round.roundIndex).toBe(1);
    expect(round.matches).toHaveLength(1);
  });
});

describe('scoring optimization over multiple rounds', () => {
  it('distributes bench time fairly across rounds', () => {
    const players = Array.from({ length: 6 }, (_, i) => makePlayer(`p${i}`));
    const rounds = generateMultipleRounds(players, 1, [], players, 0, 6);

    // Count bench appearances per player
    const benchCounts = new Map<string, number>();
    for (const p of players) benchCounts.set(p.id, 0);
    for (const round of rounds) {
      for (const id of round.benchPlayerIds) {
        benchCounts.set(id, (benchCounts.get(id) || 0) + 1);
      }
    }

    const counts = Array.from(benchCounts.values());
    const maxBench = Math.max(...counts);
    const minBench = Math.min(...counts);

    // Over 6 rounds with 6 players and 1 court (4 play, 2 bench each round),
    // total bench slots = 12, ideal = 2 per player
    // Allow some variance but should be roughly fair
    expect(maxBench - minBench).toBeLessThanOrEqual(2);
  });
});

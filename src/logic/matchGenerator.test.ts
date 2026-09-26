import { describe, it, expect } from 'vitest';
import {
  generateRound,
  generateMultipleRounds,
  regenerateSingleRound,
  regenerateSubsequentRounds,
} from './matchGenerator';
import { Player, Round, StaminaLevel } from './types';

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

describe('generateRound', () => {
  it('generates a valid round with 4 players and 1 court', () => {
    const players = ['a', 'b', 'c', 'd'].map((id) => makePlayer(id, 3));
    const round = generateRound(players, 1, [], players, 0);

    expect(round.roundIndex).toBe(0);
    expect(round.matches).toHaveLength(1);
    expect(round.benchPlayerIds).toHaveLength(0);

    const playingIds = new Set([
      ...round.matches[0].team1,
      ...round.matches[0].team2,
    ]);
    expect(playingIds.size).toBe(4);
    for (const p of players) {
      expect(playingIds.has(p.id)).toBe(true);
    }
  });

  it('benches players when there are more than court slots', () => {
    const players = Array.from({ length: 5 }, (_, i) => makePlayer(`p${i}`, 3));
    const round = generateRound(players, 1, [], players, 0);

    expect(round.matches).toHaveLength(1);
    expect(round.benchPlayerIds).toHaveLength(1);
  });
});

describe('play count fairness across multiple rounds', () => {
  it('strictly limits match count difference to <= 1 among same stamina players (1 court, 6 players, 9 rounds)', () => {
    // 6 players with standard stamina 3, 1 court (4 slots), 9 rounds -> total 36 slots -> exactly 6 matches per player!
    const players = Array.from({ length: 6 }, (_, i) => makePlayer(`p${i}`, 3));
    const rounds = generateMultipleRounds(players, 1, [], players, 0, 9);

    const playCounts = new Map<string, number>();
    for (const p of players) playCounts.set(p.id, 0);

    for (const round of rounds) {
      for (const m of round.matches) {
        for (const pid of [...m.team1, ...m.team2]) {
          playCounts.set(pid, (playCounts.get(pid) || 0) + 1);
        }
      }
    }

    const counts = Array.from(playCounts.values());
    const min = Math.min(...counts);
    const max = Math.max(...counts);

    // Difference between most played and least played must be <= 1 (ideally exactly 0)
    expect(max - min).toBeLessThanOrEqual(1);
  });

  it('strictly limits match count difference to <= 1 among same stamina players (2 courts, 10 players, 10 rounds)', () => {
    // 10 players with stamina 3, 2 courts (8 slots), 10 rounds -> total 80 slots -> exactly 8 matches each
    const players = Array.from({ length: 10 }, (_, i) => makePlayer(`p${i}`, 3));
    const rounds = generateMultipleRounds(players, 2, [], players, 0, 10);

    const playCounts = new Map<string, number>();
    for (const p of players) playCounts.set(p.id, 0);

    for (const round of rounds) {
      for (const m of round.matches) {
        for (const pid of [...m.team1, ...m.team2]) {
          playCounts.set(pid, (playCounts.get(pid) || 0) + 1);
        }
      }
    }

    const counts = Array.from(playCounts.values());
    const min = Math.min(...counts);
    const max = Math.max(...counts);

    expect(max - min).toBeLessThanOrEqual(1);
  });
});

describe('stamina effects in multi-round generation', () => {
  it('gives significantly more play time to stamina 5 than stamina 1', () => {
    const players: Player[] = [
      makePlayer('p_high', 5),
      makePlayer('p_low', 1),
      makePlayer('p_mid1', 3),
      makePlayer('p_mid2', 3),
      makePlayer('p_mid3', 3),
      makePlayer('p_mid4', 3),
    ];

    const rounds = generateMultipleRounds(players, 1, [], players, 0, 10);

    let highPlayed = 0;
    let lowPlayed = 0;

    for (const round of rounds) {
      const playing = new Set([
        ...round.matches[0].team1,
        ...round.matches[0].team2,
      ]);
      if (playing.has('p_high')) highPlayed++;
      if (playing.has('p_low')) lowPlayed++;
    }

    expect(highPlayed).toBeGreaterThan(lowPlayed);
    expect(highPlayed).toBeGreaterThanOrEqual(7);
    expect(lowPlayed).toBeLessThanOrEqual(5);
  });

  it('prevents stamina 1 from playing consecutive rounds when bench is available', () => {
    const players: Player[] = [
      makePlayer('p_low', 1),
      makePlayer('p2', 3),
      makePlayer('p3', 3),
      makePlayer('p4', 3),
      makePlayer('p5', 3),
      makePlayer('p6', 3),
    ];

    const rounds = generateMultipleRounds(players, 1, [], players, 0, 6);

    let lowConsecutivePlays = 0;
    let prevPlayed = false;

    for (const round of rounds) {
      const isPlaying =
        round.matches[0].team1.includes('p_low') || round.matches[0].team2.includes('p_low');
      if (isPlaying && prevPlayed) {
        lowConsecutivePlays++;
      }
      prevPlayed = isPlaying;
    }

    expect(lowConsecutivePlays).toBe(0);
  });
});

describe('court reassignment in multi-court generation', () => {
  it('ensures every player experiences multiple courts across rounds', () => {
    // 8 players, 2 courts, 6 rounds
    const players = Array.from({ length: 8 }, (_, i) => makePlayer(`p${i}`, 3));
    const rounds = generateMultipleRounds(players, 2, [], players, 0, 6);

    const court0Count = new Map<string, number>();
    const court1Count = new Map<string, number>();

    for (const round of rounds) {
      for (const m of round.matches) {
        const targetMap = m.courtIndex === 0 ? court0Count : court1Count;
        for (const p of [...m.team1, ...m.team2]) {
          targetMap.set(p, (targetMap.get(p) || 0) + 1);
        }
      }
    }

    let totalDiff = 0;
    for (const p of players) {
      const c0 = court0Count.get(p.id) || 0;
      const c1 = court1Count.get(p.id) || 0;
      expect(c0).toBeGreaterThan(0);
      expect(c1).toBeGreaterThan(0);
      totalDiff += Math.abs(c0 - c1);
    }

    const avgDiff = totalDiff / players.length;
    expect(avgDiff).toBeLessThanOrEqual(2.5);
  });

  it('rotates courts for players across 3 courts and reduces consecutive same court placements', () => {
    // 12 players, 3 courts, 6 rounds
    const players = Array.from({ length: 12 }, (_, i) => makePlayer(`p${i}`, 3));
    const rounds = generateMultipleRounds(players, 3, [], players, 0, 6);

    let consecutiveSameCourt = 0;
    for (let r = 1; r < rounds.length; r++) {
      const prevRound = rounds[r - 1];
      const curRound = rounds[r];

      const prevCourt = new Map<string, number>();
      for (const m of prevRound.matches) {
        for (const p of [...m.team1, ...m.team2]) {
          prevCourt.set(p, m.courtIndex);
        }
      }

      for (const m of curRound.matches) {
        for (const p of [...m.team1, ...m.team2]) {
          if (prevCourt.get(p) === m.courtIndex) {
            consecutiveSameCourt++;
          }
        }
      }
    }

    expect(consecutiveSameCourt).toBeLessThanOrEqual(15);
  });
});

describe('regenerateSingleRound and regenerateSubsequentRounds', () => {
  it('regenerates a single round properly', () => {
    const players = Array.from({ length: 6 }, (_, i) => makePlayer(`p${i}`, 3));
    const rounds = generateMultipleRounds(players, 1, [], players, 0, 3);

    const reDrawn = regenerateSingleRound(players, 1, rounds, players, 1);
    expect(reDrawn.roundIndex).toBe(1);
    expect(reDrawn.matches).toHaveLength(1);
  });

  it('regenerates subsequent rounds maintaining prior history', () => {
    const players = Array.from({ length: 6 }, (_, i) => makePlayer(`p${i}`, 3));
    const rounds = generateMultipleRounds(players, 1, [], players, 0, 5);

    const modifiedRounds = regenerateSubsequentRounds(players, 1, rounds, players, 2);
    expect(modifiedRounds).toHaveLength(5);
    expect(modifiedRounds[0]).toEqual(rounds[0]);
    expect(modifiedRounds[1]).toEqual(rounds[1]);
  });
});

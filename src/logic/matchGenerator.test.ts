import { describe, it, expect } from 'vitest';
import { generateRound, generateMultipleRounds, regenerateRound } from './matchGenerator';
import { Player, Round, StaminaLevel } from './types';
import { PLAYERS_PER_COURT } from './constants';

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
    expect(round.status).toBe('pending');
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

describe('stamina effects in multi-round generation', () => {
  it('gives significantly more play time to stamina 5 than stamina 1', () => {
    // 6 players with 1 court (4 play, 2 rest each round) for 10 rounds
    // Player 'p_high' has stamina 5, 'p_low' has stamina 1, others have stamina 3
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

    // Stamina 5 should play substantially more than stamina 1
    expect(highPlayed).toBeGreaterThan(lowPlayed);
    expect(highPlayed).toBeGreaterThanOrEqual(7); // mostly playing
    expect(lowPlayed).toBeLessThanOrEqual(5);     // well-rested
  });

  it('prevents stamina 1 from playing consecutive rounds when bench is available', () => {
    // 6 players, 1 court for 6 rounds
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
      const isPlaying = round.matches[0].team1.includes('p_low') || round.matches[0].team2.includes('p_low');
      if (isPlaying && prevPlayed) {
        lowConsecutivePlays++;
      }
      prevPlayed = isPlaying;
    }

    // Stamina 1 should have zero (or minimal) consecutive games
    expect(lowConsecutivePlays).toBe(0);
  });
});

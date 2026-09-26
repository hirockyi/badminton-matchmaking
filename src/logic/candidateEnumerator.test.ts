import { describe, it, expect } from 'vitest';
import { calculateTotalCombinations, enumerateAllCandidates } from './candidateEnumerator';
import { Player } from './types';

function createMockPlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
    active: true,
    joinedAtRound: 0,
    stamina: 5,
  }));
}

describe('candidateEnumerator', () => {
  describe('calculateTotalCombinations', () => {
    it('calculates combinations correctly for 1 court', () => {
      // 4 players, 1 court: 4C4 * 3 = 3
      expect(calculateTotalCombinations(4, 1)).toBe(3);
      // 5 players, 1 court: 5C4 * 3 = 15
      expect(calculateTotalCombinations(5, 1)).toBe(15);
      // 6 players, 1 court: 6C4 * 3 = 45
      expect(calculateTotalCombinations(6, 1)).toBe(45);
      // 8 players, 1 court: 8C4 * 3 = 210
      expect(calculateTotalCombinations(8, 1)).toBe(210);
    });

    it('calculates combinations correctly for 2 courts', () => {
      // 8 players, 2 courts: 8C8 * 315 = 315
      expect(calculateTotalCombinations(8, 2)).toBe(315);
      // 9 players, 2 courts: 9C8 * 315 = 2835
      expect(calculateTotalCombinations(9, 2)).toBe(2835);
    });

    it('returns 0 when not enough players', () => {
      expect(calculateTotalCombinations(3, 1)).toBe(0);
      expect(calculateTotalCombinations(7, 2)).toBe(0);
    });
  });

  describe('enumerateAllCandidates', () => {
    it('enumerates all candidates exactly for 4 players, 1 court', () => {
      const players = createMockPlayers(4);
      const candidates = enumerateAllCandidates(players, 1);
      expect(candidates).not.toBeNull();
      expect(candidates!.length).toBe(3);
      expect(candidates![0].benchPlayerIds).toHaveLength(0);
      expect(candidates![0].matches).toHaveLength(1);
    });

    it('enumerates all candidates exactly for 5 players, 1 court', () => {
      const players = createMockPlayers(5);
      const candidates = enumerateAllCandidates(players, 1);
      expect(candidates).not.toBeNull();
      expect(candidates!.length).toBe(15);
      expect(candidates![0].benchPlayerIds).toHaveLength(1);
    });

    it('enumerates all candidates exactly for 8 players, 2 courts', () => {
      const players = createMockPlayers(8);
      const candidates = enumerateAllCandidates(players, 2);
      expect(candidates).not.toBeNull();
      expect(candidates!.length).toBe(315);
      expect(candidates![0].matches).toHaveLength(2);
      expect(candidates![0].benchPlayerIds).toHaveLength(0);
    });

    it('returns null when combinations exceed threshold', () => {
      const players = createMockPlayers(9);
      // 9 players, 2 courts = 2835 combinations > default 1200
      const candidates = enumerateAllCandidates(players, 2);
      expect(candidates).toBeNull();
    });
  });
});

import { useState, useCallback, useMemo } from 'react';
import { Player, Round } from '../logic/types';
import {
  DEFAULT_STAMINA,
  DEFAULT_LOOKAHEAD_ROUNDS,
  DEFAULT_COURT_COUNT,
  DEFAULT_PLAYER_COUNT,
  PLAYERS_PER_COURT,
} from '../logic/constants';
import {
  generateMultipleRounds,
  regenerateSubsequentRounds,
} from '../logic/matchGenerator';

// Helper to create initial default player list (1 to N)
function createInitialPlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `player-${i + 1}`,
    name: String(i + 1),
    active: true,
    joinedAtRound: 0,
    stamina: DEFAULT_STAMINA,
  }));
}

export function useMatchSession() {
  const [players, setPlayers] = useState<Player[]>(() =>
    createInitialPlayers(DEFAULT_PLAYER_COUNT)
  );
  const [courtCount, setCourtCount] = useState<number>(DEFAULT_COURT_COUNT);
  const [lookaheadCount, setLookaheadCount] = useState<number>(DEFAULT_LOOKAHEAD_ROUNDS);
  const [rounds, setRounds] = useState<Round[]>([]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Target round index for regeneration modal
  const [regeneratingRoundIndex, setRegeneratingRoundIndex] = useState<number | null>(null);

  // Subsequent rounds recalc prompt state after manual edit
  const [pendingRecalcPrompt, setPendingRecalcPrompt] = useState<{
    roundIndex: number;
    subsequentCount: number;
    updatedRound: Round;
  } | null>(null);

  // Active players
  const activePlayers = useMemo(() => players.filter((p) => p.active), [players]);

  // Validation
  const canGenerate = activePlayers.length >= PLAYERS_PER_COURT;
  const disabledReason = !canGenerate
    ? `最低 ${PLAYERS_PER_COURT} 人の参加者が必要です（現在 ${activePlayers.length} 人）`
    : undefined;

  /**
   * Handle initial setup court count change (auto-scales players to 4x courts)
   */
  const handleInitialCourtCountChange = useCallback((newCourtCount: number) => {
    setCourtCount(newCourtCount);
    const targetPlayerCount = newCourtCount * PLAYERS_PER_COURT;

    setPlayers((prev) => {
      if (prev.length === targetPlayerCount) return prev;

      if (prev.length > targetPlayerCount) {
        return prev.slice(0, targetPlayerCount);
      }

      // Fill up to targetPlayerCount
      const updated = [...prev];
      for (let i = prev.length + 1; i <= targetPlayerCount; i++) {
        updated.push({
          id: `player-${i}`,
          name: String(i),
          active: true,
          joinedAtRound: 0,
          stamina: DEFAULT_STAMINA,
        });
      }
      return updated;
    });
  }, []);

  /**
   * Generate next batch of rounds
   */
  const handleGenerateNext = useCallback(() => {
    if (!canGenerate) return;
    const newRounds = generateMultipleRounds(
      activePlayers,
      courtCount,
      rounds,
      players,
      rounds.length,
      lookaheadCount
    );
    setRounds((prev) => [...prev, ...newRounds]);
  }, [activePlayers, courtCount, rounds, players, lookaheadCount, canGenerate]);

  /**
   * Regenerate all rounds starting from a specific index onward with updated settings
   */
  const handleConfirmRegenerateWithSettings = useCallback(
    (fromRoundIndex: number, newCourtCount: number, newPlayers: Player[]) => {
      setCourtCount(newCourtCount);
      setPlayers(newPlayers);

      const active = newPlayers.filter((p) => p.active);

      setRounds((prev) => {
        return regenerateSubsequentRounds(
          active,
          newCourtCount,
          prev,
          newPlayers,
          fromRoundIndex
        );
      });
      setRegeneratingRoundIndex(null);
    },
    []
  );

  /**
   * Update a round after manual edit
   */
  const handleUpdateRound = useCallback(
    (roundIndex: number, updatedRound: Round, hasSubsequent: boolean) => {
      setRounds((prev) => {
        const nextRounds = [...prev];
        nextRounds[roundIndex] = updatedRound;
        return nextRounds;
      });

      if (hasSubsequent) {
        setPendingRecalcPrompt({
          roundIndex,
          subsequentCount: rounds.length - 1 - roundIndex,
          updatedRound,
        });
      }
    },
    [rounds.length]
  );

  /**
   * Confirm subsequent rounds recalculation after manual edit
   */
  const handleConfirmRecalculateSubsequent = useCallback(() => {
    if (!pendingRecalcPrompt) return;
    const { roundIndex } = pendingRecalcPrompt;
    setPendingRecalcPrompt(null);

    setRounds((prev) => {
      const historyBeforeAndTarget = prev.slice(0, roundIndex + 1);
      const subsequentCount = prev.length - 1 - roundIndex;
      if (subsequentCount <= 0) return prev;

      const newSubsequent = generateMultipleRounds(
        activePlayers,
        courtCount,
        historyBeforeAndTarget,
        players,
        roundIndex + 1,
        subsequentCount
      );

      return [...historyBeforeAndTarget, ...newSubsequent];
    });
  }, [pendingRecalcPrompt, activePlayers, courtCount, players]);

  /**
   * Dismiss recalculation prompt
   */
  const handleDismissRecalculate = useCallback(() => {
    setPendingRecalcPrompt(null);
  }, []);

  /**
   * Add a new player
   */
  const handleAddPlayer = useCallback(() => {
    setPlayers((prev) => {
      let maxNum = 0;
      for (const p of prev) {
        const n = parseInt(p.name, 10);
        if (!isNaN(n) && n > maxNum) {
          maxNum = n;
        }
      }
      const nextNum = maxNum > 0 ? maxNum + 1 : prev.length + 1;
      const uniqueId = `player-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      const newPlayer: Player = {
        id: uniqueId,
        name: String(nextNum),
        active: true,
        joinedAtRound: rounds.length,
        stamina: DEFAULT_STAMINA,
      };
      return [...prev, newPlayer];
    });
  }, [rounds.length]);

  /**
   * Reset all match and player data
   */
  const handleReset = useCallback(() => {
    if (!window.confirm('すべてのデータ（対戦表・参加者設定）を初期化しますか？')) return;
    setPlayers(createInitialPlayers(DEFAULT_PLAYER_COUNT));
    setCourtCount(DEFAULT_COURT_COUNT);
    setLookaheadCount(DEFAULT_LOOKAHEAD_ROUNDS);
    setRounds([]);
    setIsSettingsOpen(false);
    setPendingRecalcPrompt(null);
    setRegeneratingRoundIndex(null);
  }, []);

  return {
    // State
    players,
    setPlayers,
    courtCount,
    setCourtCount,
    lookaheadCount,
    setLookaheadCount,
    rounds,
    activePlayers,
    canGenerate,
    disabledReason,
    isSettingsOpen,
    setIsSettingsOpen,
    pendingRecalcPrompt,
    regeneratingRoundIndex,
    setRegeneratingRoundIndex,

    // Actions
    handleInitialCourtCountChange,
    handleGenerateNext,
    handleConfirmRegenerateWithSettings,
    handleUpdateRound,
    handleConfirmRecalculateSubsequent,
    handleDismissRecalculate,
    handleAddPlayer,
    handleReset,
  };
}

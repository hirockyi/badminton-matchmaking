import { useState, useCallback, useMemo } from 'react';
import { Player, Round } from '../logic/types';
import {
  DEFAULT_COURT_COUNT,
  DEFAULT_PLAYER_COUNT,
  DEFAULT_LOOKAHEAD_ROUNDS,
  DEFAULT_STAMINA,
  PLAYERS_PER_COURT,
} from '../logic/constants';
import {
  generateMultipleRounds,
  regenerateSingleRound,
  regenerateSubsequentRounds,
} from '../logic/matchGenerator';

function createInitialPlayers(count: number = DEFAULT_PLAYER_COUNT): Player[] {
  return Array.from({ length: count }, (_, i) => {
    const num = i + 1;
    return {
      id: `player-${num}`,
      name: String(num),
      active: true,
      joinedAtRound: 0,
      stamina: DEFAULT_STAMINA,
    };
  });
}

export function useMatchSession() {
  const [players, setPlayers] = useState<Player[]>(() => createInitialPlayers(DEFAULT_PLAYER_COUNT));
  const [courtCount, setCourtCount] = useState(DEFAULT_COURT_COUNT);
  const [lookaheadCount, setLookaheadCount] = useState(DEFAULT_LOOKAHEAD_ROUNDS);
  const [rounds, setRounds] = useState<Round[]>([]);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pendingRecalcPrompt, setPendingRecalcPrompt] = useState<{
    roundIndex: number;
    subsequentCount: number;
  } | null>(null);

  const activePlayers = useMemo(
    () => players.filter((p) => p.active),
    [players]
  );

  const requiredPlayers = courtCount * PLAYERS_PER_COURT;
  const canGenerate = activePlayers.length >= requiredPlayers;

  const disabledReason = useMemo(() => {
    if (activePlayers.length < PLAYERS_PER_COURT) {
      return `最低 ${PLAYERS_PER_COURT} 人の参加者が必要です（現在 ${activePlayers.length} 人）`;
    }
    if (activePlayers.length < requiredPlayers) {
      return `${courtCount} 面（${requiredPlayers} 人必要）に対して現在 ${activePlayers.length} 人です`;
    }
    return undefined;
  }, [activePlayers.length, courtCount, requiredPlayers]);

  /**
   * Automatically scale player count to 4x court count on initial setup screen
   */
  const handleInitialCourtCountChange = useCallback((newCourtCount: number) => {
    setCourtCount(newCourtCount);
    const targetPlayerCount = newCourtCount * PLAYERS_PER_COURT;

    setPlayers((prev) => {
      if (prev.length === targetPlayerCount) return prev;
      if (prev.length > targetPlayerCount) {
        return prev.slice(0, targetPlayerCount);
      }
      const updated = [...prev];
      for (let i = prev.length; i < targetPlayerCount; i++) {
        const num = i + 1;
        updated.push({
          id: `player-${num}`,
          name: String(num),
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
   * Re-draw a single round in place
   */
  const handleRegenerateRound = useCallback(
    (roundIndex: number) => {
      setRounds((prev) => {
        const newRound = regenerateSingleRound(
          activePlayers,
          courtCount,
          prev,
          players,
          roundIndex
        );
        const updated = [...prev];
        updated[roundIndex] = newRound;
        return updated;
      });
    },
    [activePlayers, courtCount, players]
  );

  /**
   * Delete a single round
   */
  const handleDeleteRound = useCallback((roundIndex: number) => {
    setRounds((prev) => {
      const filtered = prev.filter((_, i) => i !== roundIndex);
      return filtered.map((round, newIdx) => ({
        ...round,
        roundIndex: newIdx,
      }));
    });
  }, []);

  /**
   * Update a round after manual edit
   */
  const handleUpdateRound = useCallback(
    (roundIndex: number, updatedRound: Round, hasSubsequent: boolean) => {
      setRounds((prev) => {
        const updated = [...prev];
        updated[roundIndex] = updatedRound;
        return updated;
      });

      if (hasSubsequent) {
        setPendingRecalcPrompt({
          roundIndex,
          subsequentCount: rounds.length - (roundIndex + 1),
        });
      }
    },
    [rounds.length]
  );

  /**
   * Recalculate subsequent rounds after manual edit confirmation
   */
  const handleConfirmRecalculateSubsequent = useCallback(() => {
    if (!pendingRecalcPrompt) return;
    const fromIndex = pendingRecalcPrompt.roundIndex + 1;

    setRounds((prev) => {
      return regenerateSubsequentRounds(
        activePlayers,
        courtCount,
        prev,
        players,
        fromIndex
      );
    });

    setPendingRecalcPrompt(null);
  }, [pendingRecalcPrompt, activePlayers, courtCount, players]);

  const handleDismissRecalculate = useCallback(() => {
    setPendingRecalcPrompt(null);
  }, []);

  /**
   * Add a new player (mid-game or initial)
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

    // Actions
    handleInitialCourtCountChange,
    handleGenerateNext,
    handleRegenerateRound,
    handleDeleteRound,
    handleUpdateRound,
    handleConfirmRecalculateSubsequent,
    handleDismissRecalculate,
    handleAddPlayer,
    handleReset,
  };
}

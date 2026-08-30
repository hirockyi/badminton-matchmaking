import { useState, useCallback, useMemo } from 'react';
import { Player, Round } from './logic/types';
import {
  DEFAULT_COURT_COUNT,
  DEFAULT_PLAYER_COUNT,
  DEFAULT_LOOKAHEAD_ROUNDS,
  DEFAULT_STAMINA,
  PLAYERS_PER_COURT,
} from './logic/constants';
import {
  generateMultipleRounds,
  regenerateSingleRound,
  regenerateSubsequentRounds,
} from './logic/matchGenerator';
import { InitialSetup } from './components/InitialSetup';
import { MatchTimeline } from './components/MatchTimeline';
import { SettingsModal } from './components/SettingsModal';
import { RegenerateConfirmModal } from './components/RegenerateConfirmModal';
import { Statistics } from './components/Statistics';

function createInitialPlayers(): Player[] {
  return Array.from({ length: DEFAULT_PLAYER_COUNT }, (_, i) => {
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

export default function App() {
  const [players, setPlayers] = useState<Player[]>(createInitialPlayers);
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

  // Initial Start Session / Next batch generate
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

  // Re-draw a single round in place
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

  // Delete / Undo a round
  const handleDeleteRound = useCallback((roundIndex: number) => {
    setRounds((prev) => {
      const filtered = prev.filter((_, i) => i !== roundIndex);
      // Re-index remaining rounds
      return filtered.map((round, newIdx) => ({
        ...round,
        roundIndex: newIdx,
      }));
    });
  }, []);

  // Update a round after manual edit
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

  // User chose to regenerate subsequent rounds after a manual edit
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

  const handlePlayersChange = useCallback((newPlayers: Player[]) => {
    setPlayers(newPlayers);
  }, []);

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

  const handleReset = useCallback(() => {
    if (!window.confirm('すべてのデータ（対戦表・参加者設定）を初期化しますか？')) return;
    setPlayers(createInitialPlayers());
    setCourtCount(DEFAULT_COURT_COUNT);
    setLookaheadCount(DEFAULT_LOOKAHEAD_ROUNDS);
    setRounds([]);
    setIsSettingsOpen(false);
    setPendingRecalcPrompt(null);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center">
      {/* Mobile-sized app container */}
      <div className="w-full max-w-[430px] min-h-screen bg-slate-50 flex flex-col shadow-2xl border-x border-slate-200">
        {/* Top Header */}
        <header className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-4 py-3.5 sticky top-0 z-20 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏸</span>
            <h1 className="text-base font-black tracking-tight">バドミントン対戦作成</h1>
          </div>
          <div className="flex items-center gap-1.5">
            {rounds.length > 0 && (
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="text-xs bg-emerald-800/80 hover:bg-emerald-900 active:bg-emerald-950 px-2.5 py-1.5 rounded-lg font-bold text-emerald-100 flex items-center gap-1 transition-colors"
              >
                <span>⚙️</span> 設定
              </button>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="text-xs bg-emerald-800/50 hover:bg-emerald-900/80 active:bg-emerald-950 px-2 py-1.5 rounded-lg text-emerald-200 transition-colors"
            >
              初期化
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-3 space-y-4 pb-12 overflow-y-auto">
          {rounds.length === 0 ? (
            /* Screen 1: Required Initial Setup Screen */
            <InitialSetup
              courtCount={courtCount}
              onCourtCountChange={handleInitialCourtCountChange}
              players={players}
              onPlayersChange={handlePlayersChange}
              onAddPlayer={handleAddPlayer}
              lookaheadCount={lookaheadCount}
              onLookaheadCountChange={setLookaheadCount}
              onStartSession={handleGenerateNext}
              canGenerate={canGenerate}
              disabledReason={disabledReason}
            />
          ) : (
            /* Screen 2: Active Matches Timeline */
            <>
              <section>
                <MatchTimeline
                  rounds={rounds}
                  players={players}
                  activePlayers={activePlayers}
                  courtCount={courtCount}
                  lookaheadCount={lookaheadCount}
                  onLookaheadCountChange={setLookaheadCount}
                  onGenerateNext={handleGenerateNext}
                  canGenerate={canGenerate}
                  disabledReason={disabledReason}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                  onUpdateRound={handleUpdateRound}
                  onRegenerateRound={handleRegenerateRound}
                  onDeleteRound={handleDeleteRound}
                />
              </section>

              {/* Statistics Card */}
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-3.5">
                <Statistics players={players} rounds={rounds} />
              </section>
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="text-center text-[11px] text-slate-400 py-3 bg-slate-100 border-t border-slate-200">
          🏸 Badminton MatchMaking
        </footer>
      </div>

      {/* Mid-Game Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        courtCount={courtCount}
        onCourtCountChange={setCourtCount}
        players={players}
        onPlayersChange={handlePlayersChange}
        onAddPlayer={handleAddPlayer}
        currentTotalRounds={rounds.length}
      />

      {/* Subsequent Rounds Recalculate Confirmation Modal */}
      <RegenerateConfirmModal
        isOpen={pendingRecalcPrompt !== null}
        editedRoundNumber={(pendingRecalcPrompt?.roundIndex ?? 0) + 1}
        subsequentRoundsCount={pendingRecalcPrompt?.subsequentCount ?? 0}
        onConfirmRegenerate={handleConfirmRecalculateSubsequent}
        onKeepExisting={handleDismissRecalculate}
      />
    </div>
  );
}

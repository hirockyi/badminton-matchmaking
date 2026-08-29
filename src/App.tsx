import { useState, useCallback, useMemo } from 'react';
import { Player, Round } from './logic/types';
import { DEFAULT_COURT_COUNT, DEFAULT_LOOKAHEAD_ROUNDS, DEFAULT_STAMINA, PLAYERS_PER_COURT } from './logic/constants';
import { generateMultipleRounds, regenerateRound } from './logic/matchGenerator';
import { PlayerManager } from './components/PlayerManager';
import { CourtSetting } from './components/CourtSetting';
import { GenerateControl } from './components/GenerateControl';
import { PendingRounds } from './components/PendingRounds';
import { ConfirmedRounds } from './components/ConfirmedRounds';
import { Statistics } from './components/Statistics';

let nextPlayerId = 0;
function createPlayer(currentRoundIndex: number): Player {
  nextPlayerId++;
  return {
    id: `player-${nextPlayerId}`,
    name: String(nextPlayerId),
    active: true,
    joinedAtRound: currentRoundIndex,
    stamina: DEFAULT_STAMINA,
  };
}

export default function App() {
  const [players, setPlayers] = useState<Player[]>(() => {
    // Start with 4 default players
    const initial: Player[] = [];
    for (let i = 0; i < 4; i++) {
      initial.push(createPlayer(0));
    }
    return initial;
  });
  const [courtCount, setCourtCount] = useState(DEFAULT_COURT_COUNT);
  const [lookaheadCount, setLookaheadCount] = useState(DEFAULT_LOOKAHEAD_ROUNDS);
  const [confirmedRounds, setConfirmedRounds] = useState<Round[]>([]);
  const [pendingRounds, setPendingRounds] = useState<Round[]>([]);

  const activePlayers = useMemo(
    () => players.filter((p) => p.active),
    [players]
  );

  const maxCourts = useMemo(
    () => Math.max(1, Math.floor(activePlayers.length / PLAYERS_PER_COURT)),
    [activePlayers]
  );

  // Adjust court count if it exceeds max
  const effectiveCourtCount = useMemo(
    () => Math.min(courtCount, maxCourts),
    [courtCount, maxCourts]
  );

  const nextRoundIndex = confirmedRounds.length;

  const canGenerate = activePlayers.length >= PLAYERS_PER_COURT;

  const handleGenerate = useCallback(() => {
    if (!canGenerate) return;
    const rounds = generateMultipleRounds(
      activePlayers,
      effectiveCourtCount,
      confirmedRounds,
      players,
      nextRoundIndex,
      lookaheadCount
    );
    setPendingRounds(rounds);
  }, [activePlayers, effectiveCourtCount, confirmedRounds, players, nextRoundIndex, lookaheadCount, canGenerate]);

  const handleRegenerate = useCallback(
    (roundIndex: number) => {
      setPendingRounds((prev) => {
        const idx = prev.findIndex((r) => r.roundIndex === roundIndex);
        if (idx === -1) return prev;

        // Rounds before this one in pending list serve as virtual history
        const pendingBefore = prev.slice(0, idx);
        const newRound = regenerateRound(
          activePlayers,
          effectiveCourtCount,
          confirmedRounds,
          pendingBefore,
          players,
          roundIndex
        );

        const updated = [...prev];
        updated[idx] = newRound;
        return updated;
      });
    },
    [activePlayers, effectiveCourtCount, confirmedRounds, players]
  );

  const handleConfirm = useCallback(
    (roundIndex: number) => {
      setPendingRounds((prev) => {
        const idx = prev.findIndex((r) => r.roundIndex === roundIndex);
        if (idx === -1) return prev;

        const round = { ...prev[idx], status: 'confirmed' as const };
        setConfirmedRounds((cr) => [...cr, round]);

        // Remove this round from pending
        return prev.filter((_, i) => i !== idx);
      });
    },
    []
  );

  const handleRoundChange = useCallback(
    (updatedRound: Round) => {
      setPendingRounds((prev) =>
        prev.map((r) => (r.roundIndex === updatedRound.roundIndex ? updatedRound : r))
      );
    },
    []
  );

  const handlePlayersChange = useCallback((newPlayers: Player[]) => {
    setPlayers(newPlayers);
  }, []);

  const handleAddPlayer = useCallback(() => {
    const newPlayer = createPlayer(nextRoundIndex);
    setPlayers((prev) => [...prev, newPlayer]);
  }, [nextRoundIndex]);

  const handleReset = useCallback(() => {
    if (!window.confirm('すべてのデータをリセットしますか？')) return;
    nextPlayerId = 0;
    const initial: Player[] = [];
    for (let i = 0; i < 4; i++) {
      initial.push(createPlayer(0));
    }
    setPlayers(initial);
    setCourtCount(DEFAULT_COURT_COUNT);
    setLookaheadCount(DEFAULT_LOOKAHEAD_ROUNDS);
    setConfirmedRounds([]);
    setPendingRounds([]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-emerald-600 text-white shadow-md sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold">🏸 バドミントン対戦組み合わせ</h1>
          <button
            onClick={handleReset}
            className="text-sm bg-emerald-700 hover:bg-emerald-800 px-3 py-1 rounded transition-colors"
          >
            リセット
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-6">
        {/* Player Management */}
        <section className="bg-white rounded-lg shadow p-4">
          <PlayerManager
            players={players}
            onPlayersChange={handlePlayersChange}
            onAddPlayer={handleAddPlayer}
          />
        </section>

        {/* Settings & Generate */}
        <section className="bg-white rounded-lg shadow p-4 space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <CourtSetting
              courtCount={effectiveCourtCount}
              onCourtCountChange={setCourtCount}
              maxCourts={maxCourts}
            />
            <GenerateControl
              lookaheadCount={lookaheadCount}
              onLookaheadCountChange={setLookaheadCount}
              onGenerate={handleGenerate}
              canGenerate={canGenerate}
            />
          </div>
        </section>

        {/* Pending Rounds */}
        <section>
          <PendingRounds
            rounds={pendingRounds}
            players={players}
            activePlayers={activePlayers}
            onRoundChange={handleRoundChange}
            onRegenerate={handleRegenerate}
            onConfirm={handleConfirm}
          />
        </section>

        {/* Statistics */}
        <section className="bg-white rounded-lg shadow p-4">
          <Statistics players={players} confirmedRounds={confirmedRounds} />
        </section>

        {/* Confirmed Rounds */}
        <section className="bg-white rounded-lg shadow p-4">
          <ConfirmedRounds rounds={confirmedRounds} players={players} />
        </section>
      </main>

      <footer className="text-center text-xs text-gray-400 py-4">
        Badminton MatchMaking &copy; 2026
      </footer>
    </div>
  );
}

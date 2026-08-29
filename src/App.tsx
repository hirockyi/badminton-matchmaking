import { useState, useCallback, useMemo } from 'react';
import { Player, Round } from './logic/types';
import {
  DEFAULT_COURT_COUNT,
  DEFAULT_LOOKAHEAD_ROUNDS,
  DEFAULT_STAMINA,
  PLAYERS_PER_COURT,
  MAX_SELECTABLE_COURTS,
} from './logic/constants';
import { generateMultipleRounds, regenerateRound } from './logic/matchGenerator';
import { PlayerManager } from './components/PlayerManager';
import { CourtSetting } from './components/CourtSetting';
import { GenerateControl } from './components/GenerateControl';
import { PendingRounds } from './components/PendingRounds';
import { ConfirmedRounds } from './components/ConfirmedRounds';
import { Statistics } from './components/Statistics';

function createInitialPlayers(): Player[] {
  return [1, 2, 3, 4].map((num) => ({
    id: `player-${num}`,
    name: String(num),
    active: true,
    joinedAtRound: 0,
    stamina: DEFAULT_STAMINA,
  }));
}

export default function App() {
  const [players, setPlayers] = useState<Player[]>(createInitialPlayers);
  const [courtCount, setCourtCount] = useState(DEFAULT_COURT_COUNT);
  const [lookaheadCount, setLookaheadCount] = useState(DEFAULT_LOOKAHEAD_ROUNDS);
  const [confirmedRounds, setConfirmedRounds] = useState<Round[]>([]);
  const [pendingRounds, setPendingRounds] = useState<Round[]>([]);

  const activePlayers = useMemo(
    () => players.filter((p) => p.active),
    [players]
  );

  const nextRoundIndex = confirmedRounds.length;

  // Calculate required players for the selected courts
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

  const handleGenerate = useCallback(() => {
    if (!canGenerate) return;
    const rounds = generateMultipleRounds(
      activePlayers,
      courtCount,
      confirmedRounds,
      players,
      nextRoundIndex,
      lookaheadCount
    );
    setPendingRounds(rounds);
  }, [activePlayers, courtCount, confirmedRounds, players, nextRoundIndex, lookaheadCount, canGenerate]);

  const handleRegenerate = useCallback(
    (roundIndex: number) => {
      setPendingRounds((prev) => {
        const idx = prev.findIndex((r) => r.roundIndex === roundIndex);
        if (idx === -1) return prev;

        // Rounds before this one in pending list serve as virtual history
        const pendingBefore = prev.slice(0, idx);
        const newRound = regenerateRound(
          activePlayers,
          courtCount,
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
    [activePlayers, courtCount, confirmedRounds, players]
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
    setPlayers((prev) => {
      // Find the highest numeric name or fallback to prev.length + 1
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
        joinedAtRound: nextRoundIndex,
        stamina: DEFAULT_STAMINA,
      };
      return [...prev, newPlayer];
    });
  }, [nextRoundIndex]);

  const handleReset = useCallback(() => {
    if (!window.confirm('すべてのデータ（参加者・履歴）を初期化しますか？')) return;
    setPlayers(createInitialPlayers());
    setCourtCount(DEFAULT_COURT_COUNT);
    setLookaheadCount(DEFAULT_LOOKAHEAD_ROUNDS);
    setConfirmedRounds([]);
    setPendingRounds([]);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center">
      {/* Mobile-sized container (fixed max width for clean mobile app feel on any device) */}
      <div className="w-full max-w-[430px] min-h-screen bg-slate-50 flex flex-col shadow-2xl border-x border-slate-200">
        
        {/* App Bar */}
        <header className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-4 py-3.5 sticky top-0 z-20 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏸</span>
            <h1 className="text-base font-bold tracking-tight">対戦組み合わせ</h1>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs bg-emerald-800/80 hover:bg-emerald-900 active:bg-emerald-950 px-2.5 py-1.5 rounded-md font-medium text-emerald-100 transition-colors"
          >
            初期化
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-3 space-y-4 pb-12 overflow-y-auto">
          {/* Player Management Card */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-3.5">
            <PlayerManager
              players={players}
              onPlayersChange={handlePlayersChange}
              onAddPlayer={handleAddPlayer}
            />
          </section>

          {/* Court Setting & Generation Control Card */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-3.5 space-y-3">
            <CourtSetting
              courtCount={courtCount}
              onCourtCountChange={setCourtCount}
              maxCourts={MAX_SELECTABLE_COURTS}
            />
            <hr className="border-slate-100" />
            <GenerateControl
              lookaheadCount={lookaheadCount}
              onLookaheadCountChange={setLookaheadCount}
              onGenerate={handleGenerate}
              canGenerate={canGenerate}
              disabledReason={disabledReason}
            />
          </section>

          {/* Pending (Lookahead) Rounds */}
          <section className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <span>🎯</span> 生成された対戦（未確定）
              </h2>
              {pendingRounds.length > 0 && (
                <span className="text-xs text-slate-500 font-medium">
                  {pendingRounds.length} 試合
                </span>
              )}
            </div>
            <PendingRounds
              rounds={pendingRounds}
              players={players}
              activePlayers={activePlayers}
              onRoundChange={handleRoundChange}
              onRegenerate={handleRegenerate}
              onConfirm={handleConfirm}
            />
          </section>

          {/* Statistics Card */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-3.5">
            <Statistics players={players} confirmedRounds={confirmedRounds} />
          </section>

          {/* Confirmed History Card */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-3.5">
            <ConfirmedRounds rounds={confirmedRounds} players={players} />
          </section>
        </main>

        {/* Footer */}
        <footer className="text-center text-[11px] text-slate-400 py-3 bg-slate-100 border-t border-slate-200">
          🏸 Badminton MatchMaking
        </footer>
      </div>
    </div>
  );
}

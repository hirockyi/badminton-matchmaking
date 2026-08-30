import { useMatchSession } from './hooks/useMatchSession';
import { InitialSetup } from './components/InitialSetup';
import { MatchTimeline } from './components/MatchTimeline';
import { SettingsModal } from './components/SettingsModal';
import { RegenerateConfirmModal } from './components/RegenerateConfirmModal';
import { Statistics } from './components/Statistics';

export default function App() {
  const {
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

    handleInitialCourtCountChange,
    handleGenerateNext,
    handleRegenerateRound,
    handleDeleteRound,
    handleUpdateRound,
    handleConfirmRecalculateSubsequent,
    handleDismissRecalculate,
    handleAddPlayer,
    handleReset,
  } = useMatchSession();

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center">
      {/* Responsive app container - scales nicely from small phones to Pixel Pro XL and tablets */}
      <div className="w-full max-w-xl min-h-screen bg-slate-50 flex flex-col shadow-2xl border-x border-slate-200">
        {/* Top Header */}
        <header className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-4 py-3 sticky top-0 z-20 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏸</span>
            <h1 className="text-lg font-black tracking-tight">バドミントン対戦作成</h1>
          </div>
          <div className="flex items-center gap-2">
            {rounds.length > 0 && (
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="text-sm bg-emerald-800/80 hover:bg-emerald-900 active:bg-emerald-950 px-3 py-1.5 rounded-lg font-bold text-emerald-100 flex items-center gap-1 transition-colors"
              >
                <span>⚙️</span> 設定
              </button>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="text-sm bg-emerald-800/50 hover:bg-emerald-900/80 active:bg-emerald-950 px-2.5 py-1.5 rounded-lg text-emerald-200 font-semibold transition-colors"
            >
              初期化
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-3.5 space-y-3.5 pb-12 overflow-y-auto">
          {rounds.length === 0 ? (
            /* Screen 1: Required Initial Setup Screen */
            <InitialSetup
              courtCount={courtCount}
              onCourtCountChange={handleInitialCourtCountChange}
              players={players}
              onPlayersChange={setPlayers}
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
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-3.5">
                <Statistics players={players} rounds={rounds} />
              </section>
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 py-3 bg-slate-100 border-t border-slate-200">
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
        onPlayersChange={setPlayers}
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

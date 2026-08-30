import React, { useState } from 'react';
import { Round, Player } from '../logic/types';

interface MatchTimelineProps {
  rounds: Round[];
  players: Player[];
  activePlayers: Player[];
  courtCount: number;
  lookaheadCount: number;
  onLookaheadCountChange: (count: number) => void;
  onGenerateNext: () => void;
  canGenerate: boolean;
  disabledReason?: string;
  onOpenSettings: () => void;
  onUpdateRound: (roundIndex: number, updatedRound: Round, hasSubsequent: boolean) => void;
  onRegenerateRound: (roundIndex: number) => void;
  onDeleteRound: (roundIndex: number) => void;
}

export const MatchTimeline: React.FC<MatchTimelineProps> = ({
  rounds,
  players,
  activePlayers,
  courtCount,
  lookaheadCount,
  onLookaheadCountChange,
  onGenerateNext,
  canGenerate,
  disabledReason,
  onOpenSettings,
  onUpdateRound,
  onRegenerateRound,
  onDeleteRound,
}) => {
  const [editingRoundIndex, setEditingRoundIndex] = useState<number | null>(null);
  const [editDraftRound, setEditDraftRound] = useState<Round | null>(null);

  const getPlayerName = (id: string) => players.find((p) => p.id === id)?.name || '不明';

  const handleStartEdit = (round: Round) => {
    setEditingRoundIndex(round.roundIndex);
    setEditDraftRound(JSON.parse(JSON.stringify(round)));
  };

  const handleCancelEdit = () => {
    setEditingRoundIndex(null);
    setEditDraftRound(null);
  };

  const handleDraftPlayerChange = (
    matchIndex: number,
    teamIndex: 1 | 2,
    playerIndex: 0 | 1,
    newPlayerId: string
  ) => {
    if (!editDraftRound) return;
    const updatedMatches = [...editDraftRound.matches];
    const targetMatch = { ...updatedMatches[matchIndex] };

    if (teamIndex === 1) {
      targetMatch.team1 = [...targetMatch.team1] as [string, string];
      targetMatch.team1[playerIndex] = newPlayerId;
    } else {
      targetMatch.team2 = [...targetMatch.team2] as [string, string];
      targetMatch.team2[playerIndex] = newPlayerId;
    }

    updatedMatches[matchIndex] = targetMatch;

    // Recalculate bench players for this round
    const playingIds = new Set<string>();
    for (const m of updatedMatches) {
      playingIds.add(m.team1[0]);
      playingIds.add(m.team1[1]);
      playingIds.add(m.team2[0]);
      playingIds.add(m.team2[1]);
    }
    const newBench = activePlayers
      .filter((p) => !playingIds.has(p.id))
      .map((p) => p.id);

    setEditDraftRound({
      ...editDraftRound,
      matches: updatedMatches,
      benchPlayerIds: newBench,
    });
  };

  const handleSaveEdit = (roundIndex: number) => {
    if (!editDraftRound) return;
    const hasSubsequent = roundIndex < rounds.length - 1;
    onUpdateRound(roundIndex, editDraftRound, hasSubsequent);
    setEditingRoundIndex(null);
    setEditDraftRound(null);
  };

  const handleDelete = (roundIndex: number) => {
    if (window.confirm(`第 ${roundIndex + 1} 試合を取り消しますか？`)) {
      onDeleteRound(roundIndex);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black text-slate-800">🏸 対戦スケジュール</span>
          <span className="text-xs bg-slate-200 text-slate-800 font-bold px-2.5 py-0.5 rounded-full">
            {rounds.length} 試合
          </span>
        </div>
      </div>

      {/* Match Cards List (Chronological: 1st, 2nd, 3rd...) */}
      <div className="space-y-2.5">
        {rounds.map((round) => {
          const isEditing = editingRoundIndex === round.roundIndex;
          const currentRoundData = isEditing && editDraftRound ? editDraftRound : round;

          const benchNames = currentRoundData.benchPlayerIds
            .map((id) => getPlayerName(id))
            .filter(Boolean);

          return (
            <div
              key={round.roundIndex}
              className={`bg-white border rounded-2xl p-3.5 shadow-sm transition-all ${
                isEditing
                  ? 'border-blue-400 ring-2 ring-blue-100 bg-blue-50/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Round Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span className="font-black text-slate-900 text-base">
                    第 {round.roundIndex + 1} 試合
                  </span>
                </div>

                {/* Actions: Edit / Redraw / Delete */}
                <div className="flex items-center gap-1.5">
                  {!isEditing && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(round)}
                        className="text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1"
                      >
                        <span>✏️</span> 変更
                      </button>
                      <button
                        type="button"
                        onClick={() => onRegenerateRound(round.roundIndex)}
                        title="この試合を再抽選"
                        className="text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 px-2.5 py-1.5 rounded-lg font-bold transition-colors"
                      >
                        🔄
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(round.roundIndex)}
                        title="この試合を取り消し"
                        className="text-xs text-rose-500 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 px-2.5 py-1.5 rounded-lg font-bold transition-colors"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Match Details */}
              <div className="py-2 space-y-2">
                {currentRoundData.matches.map((match, mIdx) => (
                  <div
                    key={mIdx}
                    className="rounded-xl p-2.5 bg-slate-50 border border-slate-100 space-y-1.5"
                  >
                    {currentRoundData.matches.length > 1 && (
                      <div className="text-xs font-black text-slate-500 px-1">
                        コート {match.courtIndex + 1}
                      </div>
                    )}

                    {isEditing ? (
                      /* Editing View (Dropdowns) */
                      <div className="flex items-center gap-2 text-sm">
                        {/* Team 1 Dropdowns */}
                        <div className="flex-1 space-y-1.5 bg-blue-50 p-2 rounded-lg border border-blue-200">
                          <div className="text-xs font-black text-blue-600 text-center">ペア A</div>
                          <select
                            value={match.team1[0]}
                            onChange={(e) =>
                              handleDraftPlayerChange(mIdx, 1, 0, e.target.value)
                            }
                            className="w-full text-base font-bold p-1.5 bg-white border border-blue-300 rounded"
                          >
                            {activePlayers.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                          <select
                            value={match.team1[1]}
                            onChange={(e) =>
                              handleDraftPlayerChange(mIdx, 1, 1, e.target.value)
                            }
                            className="w-full text-base font-bold p-1.5 bg-white border border-blue-300 rounded"
                          >
                            {activePlayers.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="text-sm font-black text-slate-400 px-1">VS</div>

                        {/* Team 2 Dropdowns */}
                        <div className="flex-1 space-y-1.5 bg-rose-50 p-2 rounded-lg border border-rose-200">
                          <div className="text-xs font-black text-rose-600 text-center">ペア B</div>
                          <select
                            value={match.team2[0]}
                            onChange={(e) =>
                              handleDraftPlayerChange(mIdx, 2, 0, e.target.value)
                            }
                            className="w-full text-base font-bold p-1.5 bg-white border border-rose-300 rounded"
                          >
                            {activePlayers.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                          <select
                            value={match.team2[1]}
                            onChange={(e) =>
                              handleDraftPlayerChange(mIdx, 2, 1, e.target.value)
                            }
                            className="w-full text-base font-bold p-1.5 bg-white border border-rose-300 rounded"
                          >
                            {activePlayers.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      /* Normal Compact Display (Extra Large Bold Text for Gym Visibility) */
                      <div className="flex items-center justify-between px-2 py-1">
                        <div className="flex items-center justify-center flex-1 min-w-0 font-black gap-2 text-base sm:text-lg">
                          <span className="text-blue-900 truncate text-right flex-1">
                            {getPlayerName(match.team1[0])}&thinsp;・&thinsp;{getPlayerName(match.team1[1])}
                          </span>
                          <span className="text-xs font-black text-slate-400 px-1.5 shrink-0 uppercase">
                            vs
                          </span>
                          <span className="text-rose-900 truncate text-left flex-1">
                            {getPlayerName(match.team2[0])}&thinsp;・&thinsp;{getPlayerName(match.team2[1])}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Bench & Edit Actions Footer */}
              <div className="flex items-center justify-between pt-1.5 text-sm text-slate-600">
                <div className="truncate flex-1 pr-2">
                  <span className="font-bold text-slate-400">💤 休憩:</span>{' '}
                  {benchNames.length > 0 ? (
                    <span className="font-bold text-slate-800">{benchNames.join(', ')}</span>
                  ) : (
                    <span className="text-slate-400">全員出場</span>
                  )}
                </div>

                {isEditing && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-3.5 py-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-bold"
                    >
                      キャンセル
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(round.roundIndex)}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-sm font-bold shadow-2xs"
                    >
                      変更を保存
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Controls Area (Right after the last match) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-3 mt-3">
        {/* 1. Change Settings Button (Placed directly above next generate button) */}
        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div>
            <div className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
              <span>⚙️</span> コート数・参加者設定
            </div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">
              {courtCount}面 / 参加{activePlayers.length}人（変更は以降に反映）
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 active:bg-slate-200 text-slate-900 text-sm font-bold rounded-lg shadow-2xs transition-colors shrink-0"
          >
            設定を変える
          </button>
        </div>

        {/* 2. Generate Next Matches Control */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <label htmlFor="timeline-lookahead-select" className="text-slate-800 text-base font-bold flex items-center gap-1.5">
              <span className="text-lg">🔮</span> 次に生成する試合数
            </label>
            <select
              id="timeline-lookahead-select"
              value={lookaheadCount}
              onChange={(e) => onLookaheadCountChange(Number(e.target.value))}
              className="px-3.5 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-bold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  {num} 試合分
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onGenerateNext}
            disabled={!canGenerate}
            className={`w-full py-4 px-4 rounded-xl font-extrabold text-white text-base tracking-wide transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 ${
              canGenerate
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25'
                : 'bg-slate-300 text-slate-500 shadow-none cursor-not-allowed'
            }`}
          >
            <span className="text-xl">🎲</span>
            ＋ 続きの {lookaheadCount} 試合を生成する
          </button>

          {!canGenerate && disabledReason && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-center font-bold">
              {disabledReason}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Round, Player } from '../types';

interface ConfirmedRoundsProps {
  rounds: Round[];
  players: Player[];
}

export const ConfirmedRounds: React.FC<ConfirmedRoundsProps> = ({ rounds, players }) => {
  if (rounds.length === 0) {
    return (
      <div>
        <h2 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-1.5">
          <span>📋</span> 確定済み試合履歴
        </h2>
        <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl mt-2 border border-slate-100">
          試合を確定するとここに履歴が一覧表示されます
        </p>
      </div>
    );
  }

  const getPlayerName = (id: string) => players.find((p) => p.id === id)?.name || '不明';

  // Sort newest first
  const reversedRounds = [...rounds].sort((a, b) => b.roundIndex - a.roundIndex);

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <span>📋</span> 確定済み試合履歴
        </h2>
        <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
          全 {rounds.length} 試合
        </span>
      </div>

      <div className="space-y-1.5">
        {reversedRounds.map((round) => {
          const benchNames = round.benchPlayerIds
            .map((id) => getPlayerName(id))
            .filter(Boolean);

          return (
            <div
              key={round.roundIndex}
              className="bg-white border border-slate-200/90 rounded-xl p-2 shadow-2xs hover:border-slate-300 transition-colors flex flex-col gap-1"
            >
              {/* Header + Matches in compact lines */}
              <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-1">
                <span className="font-black text-slate-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  第 {round.roundIndex + 1} 試合
                </span>
                {benchNames.length > 0 ? (
                  <span className="text-[10px] text-slate-500 truncate max-w-[180px]">
                    <span className="font-semibold text-slate-400">休:</span> {benchNames.join(', ')}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">全員出場</span>
                )}
              </div>

              {/* Match Rows (1 line per court) */}
              <div className="space-y-1">
                {round.matches.map((match, mIdx) => (
                  <div
                    key={mIdx}
                    className="flex items-center justify-between text-xs py-0.5 px-1 rounded-md bg-slate-50/60"
                  >
                    {round.matches.length > 1 && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-1 py-0.2 rounded shrink-0 mr-1.5">
                        C{match.courtIndex + 1}
                      </span>
                    )}
                    <div className="flex items-center justify-center flex-1 min-w-0 font-bold gap-1 text-[13px]">
                      {/* Team 1 */}
                      <span className="text-blue-800 truncate text-right">
                        {getPlayerName(match.team1[0])}&thinsp;・&thinsp;{getPlayerName(match.team1[1])}
                      </span>

                      {/* VS separator */}
                      <span className="text-[10px] font-semibold text-slate-400 px-1 shrink-0">
                        vs
                      </span>

                      {/* Team 2 */}
                      <span className="text-rose-800 truncate text-left">
                        {getPlayerName(match.team2[0])}&thinsp;・&thinsp;{getPlayerName(match.team2[1])}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import { Round, Player, Match } from '../types';
import { MatchCard } from './MatchCard';

interface RoundCardProps {
  round: Round;
  players: Player[];
  activePlayers: Player[];
  onRoundChange: (round: Round) => void;
  onRegenerate: (roundIndex: number) => void;
  onConfirm: (roundIndex: number) => void;
}

export const RoundCard: React.FC<RoundCardProps> = ({
  round,
  players,
  activePlayers,
  onRoundChange,
  onRegenerate,
  onConfirm,
}) => {
  const isPending = true;

  const handleMatchChange = (matchIndex: number, newMatch: Match) => {
    const newMatches = [...round.matches];
    newMatches[matchIndex] = newMatch;
    onRoundChange({ ...round, matches: newMatches });
  };

  const benchPlayerNames = round.benchPlayerIds
    .map((id) => players.find((p) => p.id === id)?.name || '不明')
    .filter(Boolean);

  return (
    <div
      className={`rounded-2xl p-3.5 shadow-sm border transition-all ${
        isPending ? 'bg-white border-amber-300 ring-1 ring-amber-200' : 'bg-slate-50 border-slate-200'
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-black text-slate-800">
            第 {round.roundIndex + 1} 試合
          </span>
          <span
            className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
              isPending
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}
          >
            {isPending ? '未確定' : '確定済み'}
          </span>
        </div>
      </div>

      {/* Matches */}
      <div className="space-y-2.5 mb-3">
        {round.matches.map((match, i) => (
          <MatchCard
            key={i}
            match={match}
            players={players}
            activePlayers={activePlayers}
            isEditable={isPending}
            onMatchChange={(newMatch) => handleMatchChange(i, newMatch)}
          />
        ))}
      </div>

      {/* Bench (resting players) */}
      <div className="text-xs bg-slate-100 rounded-xl p-2.5 flex items-center gap-1.5 flex-wrap">
        <span className="font-bold text-slate-600 shrink-0">💤 休憩:</span>
        {benchPlayerNames.length > 0 ? (
          benchPlayerNames.map((name, idx) => (
            <span
              key={idx}
              className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium text-xs shadow-2xs"
            >
              {name}
            </span>
          ))
        ) : (
          <span className="text-slate-400">全員出場</span>
        )}
      </div>

      {/* Actions (Only when pending) */}
      {isPending && (
        <div className="flex gap-2 mt-3 pt-1">
          <button
            type="button"
            onClick={() => onRegenerate(round.roundIndex)}
            className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-colors border border-slate-200"
          >
            <span>🔄</span> この試合を再抽選
          </button>
          <button
            type="button"
            onClick={() => onConfirm(round.roundIndex)}
            className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-colors shadow-sm"
          >
            <span>✅</span> 確定する
          </button>
        </div>
      )}
    </div>
  );
};

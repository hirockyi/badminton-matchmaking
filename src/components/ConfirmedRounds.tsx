import React, { useState } from 'react';
import { Round, Player } from '../types';
import { RoundCard } from './RoundCard';

interface ConfirmedRoundsProps {
  rounds: Round[];
  players: Player[];
}

export const ConfirmedRounds: React.FC<ConfirmedRoundsProps> = ({ rounds, players }) => {
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());

  if (rounds.length === 0) {
    return (
      <div>
        <h2 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-1.5">
          <span>📋</span> 確定済み試合履歴
        </h2>
        <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl mt-2 border border-slate-100">
          まだ確定された試合はありません
        </p>
      </div>
    );
  }

  const toggleExpand = (index: number) => {
    const newSet = new Set(expandedIndices);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setExpandedIndices(newSet);
  };

  // Sort rounds newest first
  const reversedRounds = [...rounds].sort((a, b) => b.roundIndex - a.roundIndex);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <span>📋</span> 確定済み試合履歴
        </h2>
        <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
          {rounds.length} 件
        </span>
      </div>

      <div className="space-y-2 mt-2">
        {reversedRounds.map((round) => {
          const isExpanded = expandedIndices.has(round.roundIndex);

          return (
            <div
              key={round.roundIndex}
              className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs"
            >
              <button
                type="button"
                onClick={() => toggleExpand(round.roundIndex)}
                className="w-full px-3 py-2.5 bg-slate-100/70 hover:bg-slate-200/70 active:bg-slate-200 flex justify-between items-center text-left focus:outline-none transition-colors"
              >
                <span className="font-bold text-xs text-slate-700">
                  第 {round.roundIndex + 1} 試合
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {isExpanded ? '▲ 閉じる' : '▼ 表示'}
                </span>
              </button>

              {isExpanded && (
                <div className="p-2.5 bg-white border-t border-slate-200">
                  <RoundCard
                    round={round}
                    players={players}
                    activePlayers={[]}
                    onRoundChange={() => {}}
                    onRegenerate={() => {}}
                    onConfirm={() => {}}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

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
      <div className="w-full bg-white p-4 rounded shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-2">📋 確定済み履歴</h2>
        <p className="text-sm text-gray-500 text-center py-4">まだ確定されたラウンドはありません</p>
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
    <div className="w-full bg-white p-4 rounded shadow-sm">
      <h2 className="text-lg font-bold text-gray-800 mb-4">📋 確定済み履歴</h2>
      
      <div className="space-y-2">
        {reversedRounds.map(round => {
          const isExpanded = expandedIndices.has(round.roundIndex);
          
          return (
            <div key={round.roundIndex} className="border rounded overflow-hidden">
              <button
                onClick={() => toggleExpand(round.roundIndex)}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex justify-between items-center focus:outline-none"
              >
                <span className="font-medium text-gray-700">ラウンド {round.roundIndex + 1}</span>
                <span className="text-gray-400 text-sm">{isExpanded ? '▲ 閉じる' : '▼ 開く'}</span>
              </button>
              
              {isExpanded && (
                <div className="p-4 border-t bg-gray-50/50">
                  <RoundCard
                    round={round}
                    players={players}
                    activePlayers={[]} // No needed for confirmed round
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

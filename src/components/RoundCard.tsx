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
  onConfirm
}) => {
  const isPending = round.status === 'pending';

  const handleMatchChange = (matchIndex: number, newMatch: Match) => {
    const newMatches = [...round.matches];
    newMatches[matchIndex] = newMatch;
    onRoundChange({ ...round, matches: newMatches });
  };

  const benchPlayerNames = round.benchPlayerIds
    .map(id => players.find(p => p.id === id)?.name || '不明')
    .join(', ');

  return (
    <div className={`p-4 rounded-lg shadow-sm mb-4 border ${isPending ? 'bg-white border-yellow-300' : 'bg-gray-50 border-green-200'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">
          ラウンド {round.roundIndex + 1}
        </h3>
        <span className={`px-2 py-1 text-xs font-bold rounded ${isPending ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
          {isPending ? '仮' : '確定'}
        </span>
      </div>

      <div className="space-y-3 mb-4">
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

      <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded mb-4">
        <span className="font-medium">💤 休憩:</span> {benchPlayerNames || 'なし'}
      </div>

      {isPending && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onRegenerate(round.roundIndex)}
            className="flex-1 py-2 bg-yellow-400 text-yellow-900 rounded font-medium hover:bg-yellow-500 active:bg-yellow-600 text-sm flex items-center justify-center gap-1"
          >
            <span>🔄</span> 再抽選
          </button>
          <button
            onClick={() => onConfirm(round.roundIndex)}
            className="flex-1 py-2 bg-green-500 text-white rounded font-medium hover:bg-green-600 active:bg-green-700 text-sm flex items-center justify-center gap-1"
          >
            <span>✅</span> 確定
          </button>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Round, Player } from '../types';
import { RoundCard } from './RoundCard';

interface PendingRoundsProps {
  rounds: Round[];
  players: Player[];
  activePlayers: Player[];
  onRoundChange: (round: Round) => void;
  onRegenerate: (roundIndex: number) => void;
  onConfirm: (roundIndex: number) => void;
}

export const PendingRounds: React.FC<PendingRoundsProps> = ({
  rounds,
  players,
  activePlayers,
  onRoundChange,
  onRegenerate,
  onConfirm
}) => {
  if (rounds.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500 bg-gray-50 rounded border border-dashed">
        組み合わせを生成してください
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rounds.map(round => (
        <RoundCard
          key={round.roundIndex}
          round={round}
          players={players}
          activePlayers={activePlayers}
          onRoundChange={onRoundChange}
          onRegenerate={onRegenerate}
          onConfirm={onConfirm}
        />
      ))}
    </div>
  );
};

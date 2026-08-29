import React from 'react';
import { Match, Player } from '../types';

interface MatchCardProps {
  match: Match;
  players: Player[];
  isEditable: boolean;
  activePlayers: Player[];
  onMatchChange: (match: Match) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  players,
  isEditable,
  activePlayers,
  onMatchChange
}) => {
  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || '不明';

  const handlePlayerChange = (teamIndex: 1 | 2, playerIndex: 0 | 1, newPlayerId: string) => {
    const newMatch = { ...match };
    if (teamIndex === 1) {
      newMatch.team1 = [...match.team1] as [string, string];
      newMatch.team1[playerIndex] = newPlayerId;
    } else {
      newMatch.team2 = [...match.team2] as [string, string];
      newMatch.team2[playerIndex] = newPlayerId;
    }
    onMatchChange(newMatch);
  };

  const renderPlayer = (id: string, teamIndex: 1 | 2, playerIndex: 0 | 1) => {
    if (isEditable) {
      return (
        <select
          value={id}
          onChange={(e) => handlePlayerChange(teamIndex, playerIndex, e.target.value)}
          className="w-full text-sm p-1 border rounded bg-white"
        >
          {/* Ensure current player is in the list even if inactive */}
          {(!activePlayers.find(p => p.id === id)) && (
            <option value={id}>{getPlayerName(id)} (非アクティブ)</option>
          )}
          {activePlayers.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      );
    }
    return <div className="text-sm font-medium py-1">{getPlayerName(id)}</div>;
  };

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm bg-white">
      <div className="bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700 border-b">
        コート {match.courtIndex + 1}
      </div>
      <div className="flex divide-x">
        {/* Team 1 */}
        <div className="flex-1 p-2 bg-blue-50/50">
          <div className="space-y-1">
            {renderPlayer(match.team1[0], 1, 0)}
            {renderPlayer(match.team1[1], 1, 1)}
          </div>
        </div>
        {/* VS badge area */}
        <div className="flex items-center justify-center -mx-3 z-10">
          <div className="bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-bold text-gray-500">
            VS
          </div>
        </div>
        {/* Team 2 */}
        <div className="flex-1 p-2 bg-red-50/50">
          <div className="space-y-1">
            {renderPlayer(match.team2[0], 2, 0)}
            {renderPlayer(match.team2[1], 2, 1)}
          </div>
        </div>
      </div>
    </div>
  );
};

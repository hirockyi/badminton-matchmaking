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
  onMatchChange,
}) => {
  const getPlayerName = (id: string) => players.find((p) => p.id === id)?.name || '不明';

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

  const renderPlayer = (id: string, teamIndex: 1 | 2, playerIndex: 0 | 1, teamColor: 'blue' | 'red') => {
    if (isEditable) {
      return (
        <select
          value={id}
          onChange={(e) => handlePlayerChange(teamIndex, playerIndex, e.target.value)}
          className={`w-full text-base font-semibold py-1.5 px-2 border rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 ${
            teamColor === 'blue'
              ? 'border-blue-300 text-blue-900 focus:ring-blue-400'
              : 'border-rose-300 text-rose-900 focus:ring-rose-400'
          }`}
        >
          {!activePlayers.find((p) => p.id === id) && (
            <option value={id}>{getPlayerName(id)} (非アクティブ)</option>
          )}
          {activePlayers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      );
    }
    return (
      <div
        className={`text-center py-1 px-2 rounded-lg font-bold text-sm truncate ${
          teamColor === 'blue' ? 'bg-blue-100/70 text-blue-900' : 'bg-rose-100/70 text-rose-900'
        }`}
      >
        {getPlayerName(id)}
      </div>
    );
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
      <div className="bg-slate-100/80 px-3 py-1.5 text-xs font-bold text-slate-700 border-b border-slate-200 flex items-center justify-between">
        <span>コート {match.courtIndex + 1}</span>
        <span className="text-[10px] text-slate-400 font-normal">ダブルス</span>
      </div>

      <div className="flex items-stretch divide-x divide-slate-200">
        {/* Team 1 (Blue) */}
        <div className="flex-1 p-2.5 bg-blue-50/40 flex flex-col gap-1.5">
          <div className="text-[10px] font-bold text-blue-600 tracking-wider text-center uppercase">
            ペア A
          </div>
          {renderPlayer(match.team1[0], 1, 0, 'blue')}
          {renderPlayer(match.team1[1], 1, 1, 'blue')}
        </div>

        {/* Center VS Indicator */}
        <div className="w-9 bg-slate-50 flex items-center justify-center shrink-0">
          <span className="text-[10px] font-black text-slate-400 tracking-tighter">
            VS
          </span>
        </div>

        {/* Team 2 (Red) */}
        <div className="flex-1 p-2.5 bg-rose-50/40 flex flex-col gap-1.5">
          <div className="text-[10px] font-bold text-rose-600 tracking-wider text-center uppercase">
            ペア B
          </div>
          {renderPlayer(match.team2[0], 2, 0, 'red')}
          {renderPlayer(match.team2[1], 2, 1, 'red')}
        </div>
      </div>
    </div>
  );
};

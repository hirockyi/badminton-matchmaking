import React, { useState } from 'react';
import { Player, Round } from '../types';

interface StatisticsProps {
  players: Player[];
  confirmedRounds: Round[];
}

export const Statistics: React.FC<StatisticsProps> = ({ players, confirmedRounds }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (confirmedRounds.length === 0) {
    return (
      <div className="w-full bg-white p-4 rounded shadow-sm">
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <h2 className="text-lg font-bold text-gray-800">📊 統計</h2>
          <span className="text-gray-400 text-sm">{isExpanded ? '▲ 閉じる' : '▼ 開く'}</span>
        </div>
        {isExpanded && (
          <p className="text-sm text-gray-500 text-center py-4">確定済みラウンドがありません</p>
        )}
      </div>
    );
  }

  // Calculate stats per player
  const stats = players.map(player => {
    let gamesPlayed = 0;
    let gamesAvailable = 0;
    let benchCount = 0;

    for (const round of confirmedRounds) {
      if (round.roundIndex >= player.joinedAtRound) {
        // Was the player in this round?
        const isBenched = round.benchPlayerIds.includes(player.id);
        const isPlaying = round.matches.some(m => 
          m.team1.includes(player.id) || m.team2.includes(player.id)
        );

        if (isBenched || isPlaying) {
          gamesAvailable++;
          if (isPlaying) {
            gamesPlayed++;
          }
          if (isBenched) {
            benchCount++;
          }
        }
      }
    }

    const playRate = gamesAvailable > 0 
      ? Math.round((gamesPlayed / gamesAvailable) * 100) 
      : null;

    return {
      ...player,
      gamesPlayed,
      gamesAvailable,
      playRate,
      benchCount
    };
  });

  // Sort by name
  stats.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="w-full bg-white p-4 rounded shadow-sm">
      <div className="flex justify-between items-center cursor-pointer mb-2" onClick={() => setIsExpanded(!isExpanded)}>
        <h2 className="text-lg font-bold text-gray-800">📊 統計</h2>
        <span className="text-gray-400 text-sm">{isExpanded ? '▲ 閉じる' : '▼ 開く'}</span>
      </div>

      {isExpanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
              <tr>
                <th className="px-3 py-2 rounded-tl">名前</th>
                <th className="px-3 py-2">出場回数</th>
                <th className="px-3 py-2">参加可能数</th>
                <th className="px-3 py-2">出場率</th>
                <th className="px-3 py-2">休憩回数</th>
                <th className="px-3 py-2 rounded-tr">スタミナ</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(stat => (
                <tr key={stat.id} className={`border-b ${!stat.active ? 'text-gray-400 bg-gray-50' : 'text-gray-800'}`}>
                  <td className="px-3 py-2 font-medium">{stat.name} {!stat.active && '(退出)'}</td>
                  <td className="px-3 py-2">{stat.gamesPlayed}</td>
                  <td className="px-3 py-2">{stat.gamesAvailable}</td>
                  <td className="px-3 py-2">{stat.playRate !== null ? `${stat.playRate}%` : '-'}</td>
                  <td className="px-3 py-2">{stat.benchCount}</td>
                  <td className="px-3 py-2 text-yellow-500">
                    {'★'.repeat(stat.stamina)}{'☆'.repeat(5 - stat.stamina)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

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
      <div>
        <button
          type="button"
          className="w-full flex justify-between items-center text-left focus:outline-none"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <span>📊</span> 試合・出場統計
          </h2>
          <span className="text-xs text-slate-400 font-medium">{isExpanded ? '▲ 閉じる' : '▼ 開く'}</span>
        </button>
        {isExpanded && (
          <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl mt-2 border border-slate-100">
            試合が確定されるとここに統計が表示されます
          </p>
        )}
      </div>
    );
  }

  // Calculate stats per player
  const stats = players.map((player) => {
    let gamesPlayed = 0;
    let gamesAvailable = 0;
    let benchCount = 0;

    for (const round of confirmedRounds) {
      if (round.roundIndex >= player.joinedAtRound) {
        const isBenched = round.benchPlayerIds.includes(player.id);
        const isPlaying = round.matches.some(
          (m) => m.team1.includes(player.id) || m.team2.includes(player.id)
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

    const playRate =
      gamesAvailable > 0 ? Math.round((gamesPlayed / gamesAvailable) * 100) : null;

    return {
      ...player,
      gamesPlayed,
      gamesAvailable,
      playRate,
      benchCount,
    };
  });

  // Sort by natural numeric or alphabetical name
  stats.sort((a, b) => {
    const na = parseInt(a.name, 10);
    const nb = parseInt(b.name, 10);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.name.localeCompare(b.name);
  });

  return (
    <div>
      <button
        type="button"
        className="w-full flex justify-between items-center text-left focus:outline-none mb-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <span>📊</span> 試合・出場統計
          </h2>
          <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
            計 {confirmedRounds.length} 試合
          </span>
        </div>
        <span className="text-xs text-slate-400 font-medium">{isExpanded ? '▲ 閉じる' : '▼ 開く'}</span>
      </button>

      {isExpanded && (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead className="text-[11px] text-slate-500 uppercase bg-slate-100 rounded-lg">
              <tr>
                <th className="px-2.5 py-2 rounded-l-lg font-bold">名前</th>
                <th className="px-2 py-2 text-center font-bold">出場</th>
                <th className="px-2 py-2 text-center font-bold">可能</th>
                <th className="px-2 py-2 text-center font-bold">出場率</th>
                <th className="px-2 py-2 text-center font-bold">休憩</th>
                <th className="px-2 py-2 rounded-r-lg text-center font-bold">体力</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.map((stat) => (
                <tr
                  key={stat.id}
                  className={`hover:bg-slate-50/80 ${
                    !stat.active ? 'text-slate-400 bg-slate-50/50 line-through' : 'text-slate-800'
                  }`}
                >
                  <td className="px-2.5 py-2 font-bold flex items-center gap-1">
                    {stat.name}
                    {!stat.active && <span className="text-[9px] no-underline font-normal text-slate-400">(休)</span>}
                  </td>
                  <td className="px-2 py-2 text-center font-semibold text-emerald-700">
                    {stat.gamesPlayed}
                  </td>
                  <td className="px-2 py-2 text-center text-slate-500">{stat.gamesAvailable}</td>
                  <td className="px-2 py-2 text-center font-bold">
                    {stat.playRate !== null ? (
                      <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px]">
                        {stat.playRate}%
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-2 py-2 text-center text-slate-500">{stat.benchCount}</td>
                  <td className="px-2 py-2 text-center text-amber-400 tracking-tighter text-[11px]">
                    {'★'.repeat(stat.stamina)}
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

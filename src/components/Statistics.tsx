import React, { useState } from 'react';
import { Player, Round } from '../logic/types';

interface StatisticsProps {
  players: Player[];
  rounds: Round[];
}

export const Statistics: React.FC<StatisticsProps> = ({ players, rounds }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (rounds.length === 0) {
    return (
      <div>
        <button
          type="button"
          className="w-full flex justify-between items-center text-left focus:outline-none"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
            <span>📊</span> 試合・出場統計
          </h2>
          <span className="text-xs text-slate-400 font-medium">{isExpanded ? '▲ 閉じる' : '▼ 開く'}</span>
        </button>
        {isExpanded && (
          <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl mt-2 border border-slate-100">
            対戦表を生成するとここに統計が表示されます
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

    for (const round of rounds) {
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
        className="w-full flex justify-between items-center text-left focus:outline-none mb-2.5"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5">
            <span>📊</span> 試合・出場統計
          </h2>
          <span className="text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-bold">
            計 {rounds.length} 試合
          </span>
        </div>
        <span className="text-xs text-slate-400 font-bold">{isExpanded ? '▲ 閉じる' : '▼ 開く'}</span>
      </button>

      {isExpanded && (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-slate-600 uppercase bg-slate-100 rounded-lg">
              <tr>
                <th className="px-3 py-2 rounded-l-lg font-extrabold">名前</th>
                <th className="px-2.5 py-2 text-center font-extrabold">出場</th>
                <th className="px-2.5 py-2 text-center font-extrabold">可能</th>
                <th className="px-2.5 py-2 text-center font-extrabold">出場率</th>
                <th className="px-2.5 py-2 text-center font-extrabold">休憩</th>
                <th className="px-2.5 py-2 rounded-r-lg text-center font-extrabold">体力</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {stats.map((stat) => (
                <tr
                  key={stat.id}
                  className={`hover:bg-slate-50/80 ${
                    !stat.active ? 'text-slate-400 bg-slate-50/50 line-through' : 'text-slate-900'
                  }`}
                >
                  <td className="px-3 py-2.5 font-bold flex items-center gap-1">
                    {stat.name}
                    {!stat.active && <span className="text-[10px] no-underline font-normal text-slate-400">(休)</span>}
                  </td>
                  <td className="px-2.5 py-2.5 text-center font-extrabold text-emerald-700 text-base">
                    {stat.gamesPlayed}
                  </td>
                  <td className="px-2.5 py-2.5 text-center text-slate-500">{stat.gamesAvailable}</td>
                  <td className="px-2.5 py-2.5 text-center font-bold">
                    {stat.playRate !== null ? (
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md text-xs font-extrabold">
                        {stat.playRate}%
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-2.5 py-2.5 text-center text-slate-500 font-semibold">{stat.benchCount}</td>
                  <td className="px-2.5 py-2.5 text-center">
                    <span className="inline-flex gap-0.5 text-rose-500 text-xs">
                      {Array.from({ length: stat.stamina }).map((_, i) => (
                        <span key={i}>❤️</span>
                      ))}
                    </span>
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

import React from 'react';
import { Player, StaminaLevel } from '../types';

interface PlayerManagerProps {
  players: Player[];
  onPlayersChange: (players: Player[]) => void;
  onAddPlayer: () => void;
}

const HeartIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg
    className={`w-4 h-4 transition-all ${
      filled ? 'text-rose-500 fill-rose-500 drop-shadow-xs' : 'text-slate-300 fill-slate-100'
    }`}
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={filled ? '0' : '1.5'}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
    />
  </svg>
);

export const PlayerManager: React.FC<PlayerManagerProps> = ({ players, onPlayersChange, onAddPlayer }) => {
  const activeCount = players.filter((p) => p.active).length;

  const updatePlayer = (id: string, updates: Partial<Player>) => {
    onPlayersChange(players.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deletePlayer = (id: string) => {
    onPlayersChange(players.filter((p) => p.id !== id));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <span>👥</span> プレイヤー設定
          </h2>
          <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
            参加: {activeCount}人
          </span>
        </div>
        <button
          type="button"
          onClick={onAddPlayer}
          className="px-3 py-1.5 bg-blue-600 active:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1 transition-transform active:scale-95"
        >
          <span>＋</span> 追加
        </button>
      </div>

      <div className="space-y-2">
        {players.map((player) => (
          <div
            key={player.id}
            className={`flex items-center gap-1.5 p-2 rounded-xl border transition-all ${
              player.active
                ? 'bg-white border-slate-200 shadow-2xs'
                : 'bg-slate-100/70 border-slate-200 opacity-60'
            }`}
          >
            {/* Player Name Input */}
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={player.name}
                onChange={(e) => updatePlayer(player.id, { name: e.target.value })}
                placeholder="名前"
                className={`w-full px-2 py-1 border rounded-lg text-base font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 border-slate-300 ${
                  !player.active ? 'line-through text-slate-400 bg-slate-100' : 'text-slate-900'
                }`}
              />
              {player.joinedAtRound > 0 && (
                <span className="text-[10px] text-slate-400 ml-1 block leading-tight">
                  第{player.joinedAtRound + 1}試合〜
                </span>
              )}
            </div>

            {/* Stamina Rating (1-5 Hearts) */}
            <div
              className="flex items-center bg-slate-50 px-1 py-1 rounded-lg border border-slate-200"
              title={`スタミナ ${player.stamina} / 5`}
            >
              {([1, 2, 3, 4, 5] as StaminaLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => updatePlayer(player.id, { stamina: level })}
                  disabled={!player.active}
                  aria-label={`スタミナ ${level}`}
                  className="w-5 h-6 flex items-center justify-center focus:outline-none active:scale-125 transition-transform"
                >
                  <HeartIcon filled={level <= player.stamina} />
                </button>
              ))}
            </div>

            {/* Active / Leave toggle */}
            <button
              type="button"
              onClick={() => updatePlayer(player.id, { active: !player.active })}
              className={`px-2 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                player.active
                  ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white !opacity-100 shadow-2xs'
              }`}
            >
              {player.active ? '退出' : '復帰'}
            </button>

            {/* Delete button */}
            <button
              type="button"
              onClick={() => deletePlayer(player.id)}
              aria-label="削除"
              className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 active:bg-rose-100 transition-colors text-xs font-bold"
            >
              ✕
            </button>
          </div>
        ))}

        {players.length === 0 && (
          <div className="text-slate-400 text-xs text-center py-6 border border-dashed rounded-xl bg-slate-50">
            プレイヤーを追加してください
          </div>
        )}
      </div>
    </div>
  );
};

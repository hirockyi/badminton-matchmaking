import React from 'react';
import { Player, StaminaLevel } from '../types';

interface PlayerManagerProps {
  players: Player[];
  onPlayersChange: (players: Player[]) => void;
  onAddPlayer: () => void;
}

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
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-1">
            <span>👥</span> プレイヤー設定
          </h2>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
            参加: {activeCount}人
          </span>
        </div>
        <button
          type="button"
          onClick={onAddPlayer}
          className="px-3.5 py-1.5 bg-blue-600 active:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm flex items-center gap-1 transition-transform active:scale-95"
        >
          <span>＋</span> 追加
        </button>
      </div>

      <div className="space-y-2">
        {players.map((player) => (
          <div
            key={player.id}
            className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
              player.active
                ? 'bg-white border-gray-200 shadow-sm'
                : 'bg-gray-100/80 border-gray-200 opacity-60'
            }`}
          >
            {/* Player Name Input */}
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={player.name}
                onChange={(e) => updatePlayer(player.id, { name: e.target.value })}
                placeholder="名前"
                className={`w-full px-2.5 py-1.5 border rounded-lg text-base font-medium bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 border-gray-300 ${
                  !player.active ? 'line-through text-gray-400 bg-gray-100' : 'text-gray-900'
                }`}
              />
              {player.joinedAtRound > 0 && (
                <span className="text-[10px] text-gray-500 ml-1">
                  第{player.joinedAtRound + 1}試合〜参加
                </span>
              )}
            </div>

            {/* Stamina Rating (1-5 stars) */}
            <div className="flex items-center bg-gray-50 px-1.5 py-1 rounded-lg border border-gray-200">
              {([1, 2, 3, 4, 5] as StaminaLevel[]).map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => updatePlayer(player.id, { stamina: star })}
                  disabled={!player.active}
                  title={`スタミナ ${star}`}
                  className="text-amber-400 text-lg w-5 h-7 flex items-center justify-center focus:outline-none active:scale-125 transition-transform"
                >
                  {star <= player.stamina ? '★' : '☆'}
                </button>
              ))}
            </div>

            {/* Active / Leave toggle */}
            <button
              type="button"
              onClick={() => updatePlayer(player.id, { active: !player.active })}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                player.active
                  ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white !opacity-100 shadow-sm'
              }`}
            >
              {player.active ? '退出' : '復帰'}
            </button>

            {/* Delete button */}
            <button
              type="button"
              onClick={() => deletePlayer(player.id)}
              aria-label="削除"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors text-sm font-bold"
            >
              ✕
            </button>
          </div>
        ))}

        {players.length === 0 && (
          <div className="text-gray-400 text-sm text-center py-6 border border-dashed rounded-xl bg-gray-50">
            プレイヤーを追加してください
          </div>
        )}
      </div>
    </div>
  );
};

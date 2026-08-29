import React from 'react';
import { Player, StaminaLevel } from '../types';

interface PlayerManagerProps {
  players: Player[];
  onPlayersChange: (players: Player[]) => void;
  onAddPlayer: () => void;
}

export const PlayerManager: React.FC<PlayerManagerProps> = ({ players, onPlayersChange, onAddPlayer }) => {

  const updatePlayer = (id: string, updates: Partial<Player>) => {
    onPlayersChange(players.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePlayer = (id: string) => {
    onPlayersChange(players.filter(p => p.id !== id));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-gray-800">👥 プレイヤー管理</h2>
        <button
          onClick={onAddPlayer}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 active:bg-blue-700 transition-colors text-sm font-medium"
        >
          ＋追加
        </button>
      </div>

      <div className="space-y-2">
        {players.map(player => (
          <div
            key={player.id}
            className={`flex items-center gap-2 p-2 border rounded ${player.active ? 'bg-gray-50' : 'bg-gray-200 opacity-50'}`}
          >
            <input
              type="text"
              value={player.name}
              onChange={(e) => updatePlayer(player.id, { name: e.target.value })}
              className={`flex-1 min-w-0 p-1 border rounded text-sm ${!player.active && 'line-through text-gray-500'}`}
            />
            
            <div className="flex items-center">
              {([1, 2, 3, 4, 5] as StaminaLevel[]).map(star => (
                <button
                  key={star}
                  onClick={() => updatePlayer(player.id, { stamina: star })}
                  disabled={!player.active}
                  className="text-yellow-400 text-lg w-5 h-5 flex items-center justify-center focus:outline-none"
                >
                  {star <= player.stamina ? '★' : '☆'}
                </button>
              ))}
            </div>

            <button
              onClick={() => updatePlayer(player.id, { active: !player.active })}
              className={`px-2 py-1 rounded text-xs text-white font-medium whitespace-nowrap ${player.active ? 'bg-gray-500 hover:bg-gray-600' : 'bg-green-500 hover:bg-green-600 !opacity-100'}`}
            >
              {player.active ? '退出' : '復帰'}
            </button>
            <button
              onClick={() => deletePlayer(player.id)}
              className="px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 focus:outline-none text-xs font-bold"
            >
              ×
            </button>
          </div>
        ))}
        {players.length === 0 && (
          <div className="text-gray-500 text-sm text-center py-4">プレイヤーがいません。追加してください。</div>
        )}
      </div>
    </div>
  );
};

import React, { useRef, useEffect, useMemo } from 'react';
import { Player, StaminaLevel } from '../../logic/types';
import { HeartRating } from './HeartRating';
import { calcDynamicTargetPlayRates } from '../../logic/scoring';

interface PlayerListEditorProps {
  players: Player[];
  onPlayersChange: (players: Player[]) => void;
  onAddPlayer: () => void;
  maxHeightClass?: string;
  showJoinedRoundBadge?: boolean;
  courtCount?: number;
}

export const PlayerListEditor: React.FC<PlayerListEditorProps> = ({
  players,
  onPlayersChange,
  onAddPlayer,
  maxHeightClass = 'max-h-[52vh]',
  showJoinedRoundBadge = false,
  courtCount = 1,
}) => {
  const activePlayers = useMemo(() => players.filter((p) => p.active), [players]);
  const activeCount = activePlayers.length;

  // Show target play rates only when at least one active player's stamina is changed from default (3)
  const hasCustomStamina = useMemo(
    () => activePlayers.some((p) => p.stamina !== 3),
    [activePlayers]
  );

  const targetRatesMap = useMemo(() => {
    if (!hasCustomStamina || activePlayers.length === 0) {
      return new Map<string, number>();
    }
    return calcDynamicTargetPlayRates(activePlayers, courtCount);
  }, [hasCustomStamina, activePlayers, courtCount]);

  const listEndRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(players.length);

  // Auto-scroll to newly added player row
  useEffect(() => {
    if (players.length > prevCountRef.current) {
      listEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    prevCountRef.current = players.length;
  }, [players.length]);

  const updatePlayer = (id: string, updates: Partial<Player>) => {
    onPlayersChange(players.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deletePlayer = (id: string) => {
    onPlayersChange(players.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-3">
      {/* Header Bar */}
      <div className="flex justify-between items-center px-0.5">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-base sm:text-lg font-extrabold text-slate-800">👥 参加プレイヤー</span>
          <span className="text-xs sm:text-sm bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full transition-all">
            {activeCount} 人
          </span>
          {hasCustomStamina && (
            <span className="text-[11px] sm:text-xs bg-rose-50 border border-rose-200 text-rose-700 font-bold px-2 py-0.5 rounded-full transition-all animate-in fade-in">
              目標出場率 連動中
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onAddPlayer}
          className="px-4 py-2 bg-blue-600 active:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-2xs flex items-center gap-1 transition-transform active:scale-95"
        >
          <span>＋</span> プレイヤー追加
        </button>
      </div>

      {/* Players Scroll Container */}
      <div className={`space-y-2 ${maxHeightClass} overflow-y-auto pr-0.5`}>
        {players.map((player) => (
          <div
            key={player.id}
            className={`flex items-center gap-2 p-2 rounded-xl border transition-all animate-in fade-in duration-200 ${
              player.active
                ? 'bg-white border-slate-200 shadow-2xs'
                : 'bg-slate-100/70 border-slate-200 opacity-60'
            }`}
          >
            {/* Name Input */}
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={player.name}
                onChange={(e) => updatePlayer(player.id, { name: e.target.value })}
                placeholder="名前"
                className={`w-full px-3 py-1.5 border rounded-lg text-base sm:text-lg font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 border-slate-300 ${
                  !player.active ? 'line-through text-slate-400 bg-slate-100' : 'text-slate-900'
                }`}
              />
              {showJoinedRoundBadge && player.joinedAtRound > 0 && (
                <span className="text-xs text-slate-400 ml-1 block leading-tight mt-0.5">
                  第{player.joinedAtRound + 1}試合〜参加
                </span>
              )}
            </div>

            {/* Stamina Hearts Component & Target Play Rate */}
            <div className="flex flex-col items-center shrink-0">
              <HeartRating
                value={player.stamina}
                onChange={(level: StaminaLevel) => updatePlayer(player.id, { stamina: level })}
                disabled={!player.active}
                size="md"
              />
              {hasCustomStamina && player.active && targetRatesMap.has(player.id) && (
                <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 border border-rose-200/80 rounded px-1.5 py-0.2 mt-0.5 tracking-tight shadow-3xs">
                  目標 {Math.round((targetRatesMap.get(player.id) ?? 0) * 100)}%
                </span>
              )}
            </div>

            {/* Active Toggle */}
            <button
              type="button"
              onClick={() => updatePlayer(player.id, { active: !player.active })}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
                player.active
                  ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
              }`}
            >
              {player.active ? '退出' : '復帰'}
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={() => deletePlayer(player.id)}
              aria-label="削除"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 text-sm font-bold"
            >
              ✕
            </button>
          </div>
        ))}

        {/* Bottom Add Button inside scroll list */}
        <div ref={listEndRef} className="pt-1.5">
          <button
            type="button"
            onClick={onAddPlayer}
            className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/40 active:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all"
          >
            <span>＋</span> プレイヤーを追加する
          </button>
        </div>
      </div>
    </div>
  );
};

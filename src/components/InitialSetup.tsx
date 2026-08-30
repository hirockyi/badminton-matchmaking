import React, { useRef, useEffect } from 'react';
import { Player, StaminaLevel } from '../logic/types';
import { MAX_SELECTABLE_COURTS } from '../logic/constants';
import { CourtSetting } from './CourtSetting';

interface InitialSetupProps {
  courtCount: number;
  onCourtCountChange: (count: number) => void;
  players: Player[];
  onPlayersChange: (players: Player[]) => void;
  onAddPlayer: () => void;
  lookaheadCount: number;
  onLookaheadCountChange: (count: number) => void;
  onStartSession: () => void;
  canGenerate: boolean;
  disabledReason?: string;
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

export const InitialSetup: React.FC<InitialSetupProps> = ({
  courtCount,
  onCourtCountChange,
  players,
  onPlayersChange,
  onAddPlayer,
  lookaheadCount,
  onLookaheadCountChange,
  onStartSession,
  canGenerate,
  disabledReason,
}) => {
  const activeCount = players.filter((p) => p.active).length;
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

  const handleAddAndScroll = () => {
    onAddPlayer();
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-150">
      {/* Court Setting Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-3.5">
        <CourtSetting
          courtCount={courtCount}
          onCourtCountChange={onCourtCountChange}
          maxCourts={MAX_SELECTABLE_COURTS}
        />
      </div>

      {/* Players Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-3.5 space-y-2.5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold text-slate-800">👥 参加プレイヤー</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full transition-all">
              {activeCount} 人
            </span>
          </div>
          <button
            type="button"
            onClick={handleAddAndScroll}
            className="px-3.5 py-1.5 bg-blue-600 active:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1 transition-transform active:scale-95"
          >
            <span>＋</span> 追加
          </button>
        </div>

        <div className="space-y-1.5 max-h-[48vh] overflow-y-auto pr-0.5">
          {players.map((player) => (
            <div
              key={player.id}
              className={`flex items-center gap-1.5 p-1.5 rounded-xl border transition-all animate-in fade-in duration-200 ${
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
                  className={`w-full px-2.5 py-1.5 border rounded-lg text-base font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 border-slate-300 ${
                    !player.active ? 'line-through text-slate-400 bg-slate-100' : 'text-slate-900'
                  }`}
                />
              </div>

              {/* Stamina Hearts */}
              <div
                className="flex items-center bg-slate-50 px-1 py-1 rounded-lg border border-slate-200 shrink-0"
                title={`スタミナ ${player.stamina} / 5`}
              >
                {([1, 2, 3, 4, 5] as StaminaLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => updatePlayer(player.id, { stamina: level })}
                    disabled={!player.active}
                    aria-label={`スタミナ ${level}`}
                    className="w-5 h-7 flex items-center justify-center focus:outline-none active:scale-125 transition-transform"
                  >
                    <HeartIcon filled={level <= player.stamina} />
                  </button>
                ))}
              </div>

              {/* Active Toggle */}
              <button
                type="button"
                onClick={() => updatePlayer(player.id, { active: !player.active })}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
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
                className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          ))}

          {/* Bottom Add Player Button inside scroll list */}
          <div ref={listEndRef} className="pt-1">
            <button
              type="button"
              onClick={handleAddAndScroll}
              className="w-full py-2 border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/40 active:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all"
            >
              <span>＋</span> プレイヤーを追加する
            </button>
          </div>
        </div>
      </div>

      {/* Start Button Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="init-lookahead-select" className="text-slate-800 text-sm font-bold flex items-center gap-1.5">
            <span className="text-base">🔮</span> 最初に生成する試合数
          </label>
          <select
            id="init-lookahead-select"
            value={lookaheadCount}
            onChange={(e) => onLookaheadCountChange(Number(e.target.value))}
            className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-900 font-bold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
              <option key={num} value={num}>
                {num} 試合分
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onStartSession}
          disabled={!canGenerate}
          className={`w-full py-4 px-4 rounded-xl font-extrabold text-white text-base tracking-wide transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 ${
            canGenerate
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25'
              : 'bg-slate-300 text-slate-500 shadow-none cursor-not-allowed'
          }`}
        >
          <span className="text-xl">🏸</span> 対戦表を生成して練習を開始
        </button>

        {!canGenerate && disabledReason && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-center font-bold">
            {disabledReason}
          </div>
        )}
      </div>
    </div>
  );
};

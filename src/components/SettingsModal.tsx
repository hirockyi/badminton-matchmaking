import React, { useRef, useEffect } from 'react';
import { Player, StaminaLevel } from '../logic/types';
import { MAX_SELECTABLE_COURTS } from '../logic/constants';
import { CourtSetting } from './CourtSetting';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  courtCount: number;
  onCourtCountChange: (count: number) => void;
  players: Player[];
  onPlayersChange: (players: Player[]) => void;
  onAddPlayer: () => void;
  currentTotalRounds: number;
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

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  courtCount,
  onCourtCountChange,
  players,
  onPlayersChange,
  onAddPlayer,
  currentTotalRounds,
}) => {
  if (!isOpen) return null;

  const activeCount = players.filter((p) => p.active).length;
  const listEndRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(players.length);

  // Auto-scroll when new player is added
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
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-[420px] w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-4 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <h2 className="font-extrabold text-base">参加者・コート設定</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-800/60 hover:bg-emerald-900 active:bg-emerald-950 text-white text-base font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 space-y-3.5 overflow-y-auto flex-1 text-sm">
          {/* Court Setting */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <CourtSetting
              courtCount={courtCount}
              onCourtCountChange={onCourtCountChange}
              maxCourts={MAX_SELECTABLE_COURTS}
            />
          </div>

          {/* Player Management Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-800 text-sm">👥 参加者一覧</span>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">
                  {activeCount} 人
                </span>
              </div>
              <button
                type="button"
                onClick={onAddPlayer}
                className="px-3.5 py-1.5 bg-blue-600 active:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1 transition-transform active:scale-95"
              >
                <span>＋</span> 途中参加を追加
              </button>
            </div>

            <div className="space-y-1.5 max-h-[40vh] overflow-y-auto pr-0.5">
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
                    {player.joinedAtRound > 0 && (
                      <span className="text-[10px] text-slate-400 ml-1 block leading-tight">
                        第{player.joinedAtRound + 1}試合〜参加
                      </span>
                    )}
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

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => deletePlayer(player.id)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Bottom Add Player Button */}
              <div ref={listEndRef} className="pt-1">
                <button
                  type="button"
                  onClick={onAddPlayer}
                  className="w-full py-2 border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/40 active:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all"
                >
                  <span>＋</span> プレイヤーを追加する
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm rounded-xl shadow-sm transition-colors"
          >
            設定を保存して閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

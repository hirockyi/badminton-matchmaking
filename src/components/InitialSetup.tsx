import React from 'react';
import { Player } from '../logic/types';
import { MAX_SELECTABLE_COURTS } from '../logic/constants';
import { CourtSetting } from './CourtSetting';
import { PlayerListEditor } from './common/PlayerListEditor';

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

      {/* Players Card (Using unified PlayerListEditor) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-3.5">
        <PlayerListEditor
          players={players}
          onPlayersChange={onPlayersChange}
          onAddPlayer={onAddPlayer}
          maxHeightClass="max-h-[48vh]"
          showJoinedRoundBadge={false}
        />
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

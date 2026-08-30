import React from 'react';
import { Player } from '../logic/types';
import { MAX_SELECTABLE_COURTS } from '../logic/constants';
import { CourtSetting } from './CourtSetting';
import { PlayerListEditor } from './common/PlayerListEditor';

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

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  courtCount,
  onCourtCountChange,
  players,
  onPlayersChange,
  onAddPlayer,
}) => {
  if (!isOpen) return null;

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

          {/* Player Management Section (Using PlayerListEditor) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <PlayerListEditor
              players={players}
              onPlayersChange={onPlayersChange}
              onAddPlayer={onAddPlayer}
              maxHeightClass="max-h-[42vh]"
              showJoinedRoundBadge={true}
            />
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

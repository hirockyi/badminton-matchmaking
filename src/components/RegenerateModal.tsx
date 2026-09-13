import React, { useState, useEffect } from 'react';
import { Player } from '../logic/types';
import { MAX_SELECTABLE_COURTS, PLAYERS_PER_COURT } from '../logic/constants';
import { CourtSetting } from './CourtSetting';
import { PlayerListEditor } from './common/PlayerListEditor';

interface RegenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromRoundIndex: number;
  totalRounds: number;
  courtCount: number;
  players: Player[];
  onConfirmRegenerate: (newCourtCount: number, newPlayers: Player[]) => void;
}

export const RegenerateModal: React.FC<RegenerateModalProps> = ({
  isOpen,
  onClose,
  fromRoundIndex,
  totalRounds,
  courtCount,
  players,
  onConfirmRegenerate,
}) => {
  const [draftCourtCount, setDraftCourtCount] = useState(courtCount);
  const [draftPlayers, setDraftPlayers] = useState<Player[]>(players);

  // Sync draft state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setDraftCourtCount(courtCount);
      setDraftPlayers(JSON.parse(JSON.stringify(players)));
    }
  }, [isOpen, courtCount, players]);

  if (!isOpen) return null;

  const isLastRound = fromRoundIndex === totalRounds - 1;
  const subsequentCount = totalRounds - fromRoundIndex;
  const activeCount = draftPlayers.filter((p) => p.active).length;
  const minRequired = draftCourtCount * PLAYERS_PER_COURT;
  const canRegenerate = activeCount >= minRequired;

  const handleAddPlayer = () => {
    let maxNum = 0;
    for (const p of draftPlayers) {
      const n = parseInt(p.name, 10);
      if (!isNaN(n) && n > maxNum) {
        maxNum = n;
      }
    }
    const nextNum = maxNum > 0 ? maxNum + 1 : draftPlayers.length + 1;
    const uniqueId = `player-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const newPlayer: Player = {
      id: uniqueId,
      name: String(nextNum),
      active: true,
      joinedAtRound: fromRoundIndex,
      stamina: 3,
    };
    setDraftPlayers((prev) => [...prev, newPlayer]);
  };

  const handleConfirm = () => {
    if (!canRegenerate) return;
    onConfirmRegenerate(draftCourtCount, draftPlayers);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-4 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔄</span>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg">
                {isLastRound
                  ? `第 ${fromRoundIndex + 1} 試合の再抽選`
                  : `第 ${fromRoundIndex + 1} 試合以降の再抽選`}
              </h2>
              <div className="text-xs text-emerald-100 font-medium">
                {isLastRound
                  ? '第 ' + (fromRoundIndex + 1) + ' 試合（1試合分）を引き直します'
                  : `第 ${fromRoundIndex + 1} 試合 〜 第 ${totalRounds} 試合（計 ${subsequentCount} 試合）を引き直します`}
              </div>
            </div>
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
        <div className="p-3.5 space-y-3 overflow-y-auto flex-1 text-sm">
          <div className="text-xs text-slate-500 bg-slate-100 p-2.5 rounded-xl leading-relaxed">
            💡 コート数や参加者の変更（退出・復帰・追加）を行ってから再抽選できます。
            直前（第 {fromRoundIndex} 試合まで）の対戦履歴を保ったまま公平に再計算されます。
          </div>

          {/* Court Setting */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <CourtSetting
              courtCount={draftCourtCount}
              onCourtCountChange={setDraftCourtCount}
              maxCourts={MAX_SELECTABLE_COURTS}
            />
          </div>

          {/* Player Management Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <PlayerListEditor
              players={draftPlayers}
              onPlayersChange={setDraftPlayers}
              onAddPlayer={handleAddPlayer}
              maxHeightClass="max-h-[40vh]"
              showJoinedRoundBadge={true}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 space-y-2 shrink-0">
          {!canRegenerate && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 text-center font-bold">
              {draftCourtCount} 面には最低 {minRequired} 人の参加者が必要です（現在 {activeCount} 人）
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm rounded-xl transition-colors"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canRegenerate}
              className={`flex-2 py-3 px-4 rounded-xl font-extrabold text-white text-sm sm:text-base tracking-wide transition-all shadow-md flex items-center justify-center gap-1.5 ${
                canRegenerate
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 active:scale-[0.98]'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
              }`}
            >
              <span>🎲</span>
              {isLastRound
                ? `第 ${fromRoundIndex + 1} 試合を再抽選`
                : `第 ${fromRoundIndex + 1} 試合以降（${subsequentCount}試合）を再抽選`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

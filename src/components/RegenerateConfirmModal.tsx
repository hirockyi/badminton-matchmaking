import React from 'react';

interface RegenerateConfirmModalProps {
  isOpen: boolean;
  editedRoundNumber: number;
  subsequentRoundsCount: number;
  onConfirmRegenerate: () => void;
  onKeepExisting: () => void;
}

export const RegenerateConfirmModal: React.FC<RegenerateConfirmModalProps> = ({
  isOpen,
  editedRoundNumber,
  subsequentRoundsCount,
  onConfirmRegenerate,
  onKeepExisting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-2 text-amber-600 font-bold text-base">
          <span className="text-xl">🔄</span>
          <span>以降の対戦表の再生成</span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          第 <span className="font-bold text-slate-900">{editedRoundNumber}</span> 試合の選手を手動で変更しました。
        </p>
        <p className="text-xs text-slate-600 leading-relaxed bg-amber-50 border border-amber-200 rounded-xl p-2.5">
          この変更を考慮して、第 <span className="font-bold text-slate-900">{editedRoundNumber + 1}</span> 試合以降（全 <span className="font-bold text-slate-900">{subsequentRoundsCount}</span> 試合）の組み合わせを公平に再生成しますか？
        </p>

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onConfirmRegenerate}
            className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>✨</span> 以降の対戦を再生成する（推奨）
          </button>
          <button
            type="button"
            onClick={onKeepExisting}
            className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl font-semibold text-xs transition-colors"
          >
            この試合のみ変更（以降はそのまま）
          </button>
        </div>
      </div>
    </div>
  );
};

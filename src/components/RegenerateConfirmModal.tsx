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
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2.5 text-slate-800">
          <span className="text-2xl">🔄</span>
          <h3 className="text-base sm:text-lg font-black leading-tight">
            以降の対戦表を再計算しますか？
          </h3>
        </div>

        {/* Message */}
        <div className="text-sm text-slate-600 leading-relaxed space-y-2">
          <p>
            <strong>第 {editedRoundNumber} 試合</strong> のメンバーを変更しました。
          </p>
          <p>
            これ以降の <strong>{subsequentRoundsCount} 試合分</strong>{' '}
            の対戦組み合わせも、今回の変更（出場回数や連続休憩）を考慮して自動で再計算しますか？
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          <button
            type="button"
            onClick={onConfirmRegenerate}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-[0.98] text-white font-extrabold text-sm sm:text-base rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>✨</span> 以降の対戦表を再計算する（推奨）
          </button>
          <button
            type="button"
            onClick={onKeepExisting}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-sm sm:text-base rounded-xl transition-colors"
          >
            この試合のみ変更する
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';

interface GenerateControlProps {
  lookaheadCount: number;
  onLookaheadCountChange: (count: number) => void;
  onGenerate: () => void;
  canGenerate: boolean;
  disabledReason?: string;
}

export const GenerateControl: React.FC<GenerateControlProps> = ({
  lookaheadCount,
  onLookaheadCountChange,
  onGenerate,
  canGenerate,
  disabledReason,
}) => {
  return (
    <div className="w-full flex flex-col gap-3 pt-1">
      <div className="flex items-center justify-between">
        <label htmlFor="lookahead-select" className="text-gray-800 text-sm font-bold flex items-center gap-1.5">
          <span className="text-base">🔮</span> 先読み生成数
        </label>
        <select
          id="lookahead-select"
          value={lookaheadCount}
          onChange={(e) => onLookaheadCountChange(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 font-semibold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
        >
          {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
            <option key={num} value={num}>
              {num} 試合先まで
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={onGenerate}
        disabled={!canGenerate}
        className={`w-full py-3.5 px-4 rounded-xl font-bold text-white text-base tracking-wide transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 ${
          canGenerate
            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/20'
            : 'bg-gray-300 text-gray-500 shadow-none cursor-not-allowed'
        }`}
      >
        <span className="text-lg">🎲</span> 対戦組み合わせを自動生成
      </button>

      {!canGenerate && disabledReason && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 text-center font-medium">
          {disabledReason}
        </div>
      )}
    </div>
  );
};

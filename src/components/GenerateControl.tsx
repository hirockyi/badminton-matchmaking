import React from 'react';

interface GenerateControlProps {
  lookaheadCount: number;
  onLookaheadCountChange: (count: number) => void;
  onGenerate: () => void;
  canGenerate: boolean;
}

export const GenerateControl: React.FC<GenerateControlProps> = ({
  lookaheadCount,
  onLookaheadCountChange,
  onGenerate,
  canGenerate
}) => {
  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <label htmlFor="lookahead-select" className="text-gray-700 text-sm font-medium">
          生成ラウンド数
        </label>
        <select
          id="lookahead-select"
          value={lookaheadCount}
          onChange={(e) => onLookaheadCountChange(Number(e.target.value))}
          className="p-1 border rounded bg-gray-50 text-sm text-gray-800 focus:outline-none"
        >
          {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>
      
      <button
        onClick={onGenerate}
        disabled={!canGenerate}
        className={`w-full py-3 rounded-lg font-bold text-white text-lg transition-colors flex items-center justify-center gap-2 ${
          canGenerate 
            ? 'bg-green-500 hover:bg-green-600 active:bg-green-700' 
            : 'bg-gray-400 cursor-not-allowed opacity-70'
        }`}
      >
        <span>🎲</span> 組み合わせ生成
      </button>
      {!canGenerate && (
        <p className="text-xs text-red-500 text-center">※プレイヤーが不足しています</p>
      )}
    </div>
  );
};

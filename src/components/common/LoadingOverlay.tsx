import React from 'react';

interface LoadingOverlayProps {
  isOpen: boolean;
  message?: string;
  subMessage?: string;
  progress?: { current: number; total: number } | null;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isOpen,
  message = '対戦表を最適化中...',
  subMessage = '重複や休憩のバランスを計算しています',
  progress = null,
}) => {
  if (!isOpen) return null;

  const percentage = progress && progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 flex flex-col items-center text-center max-w-xs w-full space-y-4">
        {/* Animated Icon / Spinner */}
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <span className="text-2xl absolute">🏸</span>
        </div>

        {/* Text & Progress */}
        <div className="space-y-2 w-full">
          <h3 className="text-base font-extrabold text-slate-900">
            {progress
              ? `第 ${progress.current} / ${progress.total} 試合目を最適化中`
              : message}
          </h3>

          {/* Progress Bar (when multiple rounds are generating) */}
          {progress && progress.total > 1 && (
            <div className="space-y-1 w-full pt-1">
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-400 px-0.5">
                <span>{progress.current} / {progress.total} 試合</span>
                <span>{percentage}%</span>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-500 font-medium">
            {progress
              ? '1試合ずつ計算してリアルタイムに反映しています'
              : subMessage}
          </p>
        </div>
      </div>
    </div>
  );
};

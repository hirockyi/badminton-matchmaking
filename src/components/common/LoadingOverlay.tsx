import React from 'react';

interface LoadingOverlayProps {
  isOpen: boolean;
  message?: string;
  subMessage?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isOpen,
  message = '対戦表を最適化中...',
  subMessage = '重複や休憩のバランスを計算しています',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 flex flex-col items-center text-center max-w-xs w-full space-y-4">
        {/* Animated Icon / Spinner */}
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <span className="text-2xl absolute">🏸</span>
        </div>

        {/* Text */}
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-slate-900">{message}</h3>
          <p className="text-xs text-slate-500 font-medium">{subMessage}</p>
        </div>
      </div>
    </div>
  );
};

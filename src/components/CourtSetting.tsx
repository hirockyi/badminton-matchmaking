import React from 'react';
import { MAX_SELECTABLE_COURTS } from '../logic/constants';

interface CourtSettingProps {
  courtCount: number;
  onCourtCountChange: (count: number) => void;
  maxCourts?: number;
}

export const CourtSetting: React.FC<CourtSettingProps> = ({
  courtCount,
  onCourtCountChange,
  maxCourts = MAX_SELECTABLE_COURTS,
}) => {
  return (
    <div className="flex items-center justify-between w-full">
      <label htmlFor="court-count-select" className="text-slate-800 text-base sm:text-lg font-extrabold flex items-center gap-2">
        <span className="text-xl">🏸</span> 使用コート数
      </label>
      <div className="flex items-center gap-2">
        <select
          id="court-count-select"
          value={courtCount}
          onChange={(e) => onCourtCountChange(Number(e.target.value))}
          className="px-4 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-extrabold text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
        >
          {Array.from({ length: maxCourts }, (_, i) => i + 1).map((num) => (
            <option key={num} value={num}>
              {num} 面（ダブルス {num * 4}人〜）
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

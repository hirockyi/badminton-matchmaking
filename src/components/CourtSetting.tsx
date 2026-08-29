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
    <div className="flex items-center justify-between w-full py-1">
      <label htmlFor="court-count-select" className="text-gray-800 text-sm font-bold flex items-center gap-1.5">
        <span className="text-base">🏸</span> 使用コート数
      </label>
      <div className="flex items-center gap-2">
        <select
          id="court-count-select"
          value={courtCount}
          onChange={(e) => onCourtCountChange(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 font-semibold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
        >
          {Array.from({ length: maxCourts }, (_, i) => i + 1).map((num) => (
            <option key={num} value={num}>
              {num} 面（{num * 4}人〜）
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

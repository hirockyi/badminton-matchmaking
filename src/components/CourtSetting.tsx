import React from 'react';

interface CourtSettingProps {
  courtCount: number;
  onCourtCountChange: (count: number) => void;
  maxCourts: number;
}

export const CourtSetting: React.FC<CourtSettingProps> = ({ courtCount, onCourtCountChange, maxCourts }) => {
  return (
    <div className="flex items-center justify-between">
      <label htmlFor="court-count-select" className="text-gray-800 font-medium">
        🏸 コート数
      </label>
      <select
        id="court-count-select"
        value={courtCount}
        onChange={(e) => onCourtCountChange(Number(e.target.value))}
        className="p-2 border rounded bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {Array.from({ length: maxCourts }, (_, i) => i + 1).map((num) => (
          <option key={num} value={num}>
            {num}
          </option>
        ))}
      </select>
    </div>
  );
};

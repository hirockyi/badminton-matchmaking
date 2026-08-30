import React from 'react';
import { StaminaLevel } from '../../logic/types';

interface HeartRatingProps {
  value: StaminaLevel;
  onChange?: (level: StaminaLevel) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

const buttonSizeClasses = {
  sm: 'w-4 h-5',
  md: 'w-5 h-7',
  lg: 'w-6 h-8',
};

export const HeartRating: React.FC<HeartRatingProps> = ({
  value,
  onChange,
  disabled = false,
  size = 'md',
}) => {
  const isInteractive = Boolean(onChange && !disabled);

  return (
    <div
      className={`inline-flex items-center ${isInteractive ? 'bg-slate-50 px-1 py-1 rounded-lg border border-slate-200 shrink-0' : 'gap-0.5'}`}
      title={`スタミナ ${value} / 5`}
    >
      {([1, 2, 3, 4, 5] as StaminaLevel[]).map((level) => {
        const filled = level <= value;

        const icon = (
          <svg
            className={`${sizeClasses[size]} transition-all ${
              filled
                ? 'text-rose-500 fill-rose-500 drop-shadow-xs'
                : 'text-slate-300 fill-slate-100'
            }`}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={filled ? '0' : '1.5'}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        );

        if (!isInteractive) {
          return <span key={level}>{icon}</span>;
        }

        return (
          <button
            key={level}
            type="button"
            onClick={() => onChange?.(level)}
            disabled={disabled}
            aria-label={`スタミナ ${level}`}
            className={`${buttonSizeClasses[size]} flex items-center justify-center focus:outline-none active:scale-125 transition-transform`}
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
};

import React from 'react';

interface OrganicDividerProps {
  variant?: 's-curve' | 'wave-left' | 'wave-right' | 'asymmetric-ridge' | 'crest';
  fromBg?: string;
  toBg?: string;
  burgundyAccent?: boolean;
  flip?: boolean;
  className?: string;
}

export const OrganicDivider: React.FC<OrganicDividerProps> = ({
  variant = 's-curve',
  fromBg = '#faf6ef',
  toBg = '#faf6ef',
  burgundyAccent = true,
  flip = false,
  className = '',
}) => {
  return (
    <div
      className={`relative w-full overflow-hidden leading-none select-none pointer-events-none ${className} ${
        flip ? 'rotate-180' : ''
      }`}
      style={{ backgroundColor: fromBg }}
      aria-hidden="true"
    >
      {variant === 's-curve' && (
        <svg
          viewBox="0 0 1440 84"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full h-9 sm:h-12 md:h-16 lg:h-20 block"
        >
          {/* Subtle Burgundy Organic Floating Wave Behind */}
          {burgundyAccent && (
            <path
              d="M0,28 C320,72 540,8 820,54 C1120,96 1320,24 1440,42 L1440,84 L0,84 Z"
              fill="#331016"
              fillOpacity="0.08"
            />
          )}

          {/* Secondary Delicate Golden-Amber Accent Line */}
          {burgundyAccent && (
            <path
              d="M0,38 C340,78 560,18 840,58 C1140,94 1340,32 1440,48"
              stroke="#c9833a"
              strokeWidth="1.2"
              strokeOpacity="0.25"
              fill="none"
            />
          )}

          {/* Main Foreground Curve to destination background */}
          <path
            d="M0,45 C280,82 520,22 780,62 C1080,102 1300,34 1440,52 L1440,84 L0,84 Z"
            fill={toBg}
          />
        </svg>
      )}

      {variant === 'wave-left' && (
        <svg
          viewBox="0 0 1440 76"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full h-8 sm:h-11 md:h-14 lg:h-18 block"
        >
          {burgundyAccent && (
            <path
              d="M0,16 C220,68 480,74 720,38 C980,4 1260,54 1440,32 L1440,76 L0,76 Z"
              fill="#331016"
              fillOpacity="0.06"
            />
          )}
          {burgundyAccent && (
            <path
              d="M0,22 C240,72 500,76 740,42 C1000,8 1280,56 1440,36"
              stroke="#331016"
              strokeWidth="1"
              strokeOpacity="0.14"
              fill="none"
            />
          )}
          <path
            d="M0,32 C260,78 520,76 760,46 C1020,16 1280,58 1440,42 L1440,76 L0,76 Z"
            fill={toBg}
          />
        </svg>
      )}

      {variant === 'wave-right' && (
        <svg
          viewBox="0 0 1440 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full h-8 sm:h-11 md:h-14 lg:h-18 block"
        >
          {burgundyAccent && (
            <path
              d="M0,48 C240,16 540,68 820,32 C1100,-2 1320,52 1440,24 L1440,80 L0,80 Z"
              fill="#331016"
              fillOpacity="0.07"
            />
          )}
          {burgundyAccent && (
            <path
              d="M0,52 C260,22 560,72 840,36 C1120,4 1340,56 1440,28"
              stroke="#c9833a"
              strokeWidth="1.2"
              strokeOpacity="0.3"
              fill="none"
            />
          )}
          <path
            d="M0,60 C280,30 580,76 860,42 C1140,12 1340,60 1440,36 L1440,80 L0,80 Z"
            fill={toBg}
          />
        </svg>
      )}

      {variant === 'asymmetric-ridge' && (
        <svg
          viewBox="0 0 1440 90"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full h-10 sm:h-14 md:h-18 lg:h-22 block"
        >
          {burgundyAccent && (
            <path
              d="M0,24 C400,88 880,-12 1440,56 L1440,90 L0,90 Z"
              fill="#331016"
              fillOpacity="0.07"
            />
          )}
          {burgundyAccent && (
            <path
              d="M0,32 C420,92 900,-4 1440,62"
              stroke="#331016"
              strokeWidth="1.2"
              strokeOpacity="0.16"
              fill="none"
            />
          )}
          <path
            d="M0,42 C440,98 920,8 1440,70 L1440,90 L0,90 Z"
            fill={toBg}
          />
        </svg>
      )}

      {variant === 'crest' && (
        <svg
          viewBox="0 0 1440 72"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full h-8 sm:h-10 md:h-14 lg:h-16 block"
        >
          {burgundyAccent && (
            <path
              d="M0,18 Q720,78 1440,18 L1440,72 L0,72 Z"
              fill="#331016"
              fillOpacity="0.06"
            />
          )}
          <path
            d="M0,30 Q720,84 1440,30 L1440,72 L0,72 Z"
            fill={toBg}
          />
        </svg>
      )}
    </div>
  );
};

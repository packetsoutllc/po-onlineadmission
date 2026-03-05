import React from 'react';

/** Packets Out logo loading animation: 3 gray bars + blue angular shape. Very fast, no lag. */
export const LogoLoader: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'light';
  className?: string;
}> = ({ size = 'md', variant = 'default', className = '' }) => {
  const sizeMap = { sm: 'w-6 h-5', md: 'w-10 h-8', lg: 'w-14 h-11' };
  const barW = 5;
  const barXs = [6, 14, 22];
  const barHeights = [20, 17, 12];
  const barYs = barHeights.map((h) => 32 - h);
  const barFill = variant === 'light' ? '#e5e7eb' : '#4B5563';
  const strokeColor = variant === 'light' ? '#93c5fd' : '#0EA5E9';

  return (
    <svg
      className={`inline-block flex-shrink-0 ${sizeMap[size]} ${className}`}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={barXs[i]}
          y={barYs[i]}
          width={barW}
          height={barHeights[i]}
          rx={2.5}
          fill={barFill}
          className="po-logo-bar"
          style={{
            transformOrigin: `${barXs[i] + barW / 2}px 32px`,
            animationDelay: `${i * 35}ms`,
          }}
        />
      ))}
      <g className="po-logo-pulse" style={{ transformOrigin: '25px 12px' }}>
        <path
          d="M22 11L27 9L28 14L24 15.5L22 11Z"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M22 11L25.5 14.5L28 14"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};

export default LogoLoader;

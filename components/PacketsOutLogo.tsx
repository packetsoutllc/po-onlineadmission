import React from 'react';
import PacketsOutArrowIcon from './PacketsOutArrowIcon';

type LogoSize = 'sm' | 'md';

interface PacketsOutLogoProps {
  size?: LogoSize;
  /** Extra classes for the outer wrapper (color, layout, margins, etc.) */
  className?: string;
  /** Extra classes for the "Packets Out" text */
  textClassName?: string;
  /** Hide the "Packets Out" wordmark when only the icon is needed */
  showText?: boolean;
}

const sizeConfig: Record<
  LogoSize,
  { barWidth: string; firstHeight: string; secondHeight: string; arrowSize: string; gap: string; textSize: string }
> = {
  sm: {
    barWidth: 'w-1.5',
    firstHeight: 'h-3',
    secondHeight: 'h-2.5',
    arrowSize: 'w-3.5 h-3.5',
    gap: 'gap-1',
    textSize: 'text-xs',
  },
  md: {
    barWidth: 'w-2',
    firstHeight: 'h-4',
    secondHeight: 'h-3',
    arrowSize: 'w-5 h-5',
    gap: 'gap-2.5',
    textSize: 'text-xl sm:text-2xl',
  },
};

const PacketsOutLogo: React.FC<PacketsOutLogoProps> = ({
  size = 'md',
  className = '',
  textClassName = '',
  showText = true,
}) => {
  const cfg = sizeConfig[size];

  return (
    <span className={`inline-flex items-center ${cfg.gap} ${className}`}>
      <span className="flex items-start gap-[2px] mt-[10px]">
        <span className={`${cfg.barWidth} ${cfg.firstHeight} bg-black dark:bg-gray-100 rounded-full opacity-90 -mt-[1px]`} />
        <span className={`${cfg.barWidth} ${cfg.secondHeight} bg-black dark:bg-gray-100 rounded-full opacity-90 -mt-[1px]`} />
        <PacketsOutArrowIcon className={`${cfg.arrowSize} text-sky-500 -mt-[5px]`} />
      </span>
      {showText && (
        <span className={`${cfg.textSize} font-bold tracking-tight ${textClassName}`}>
          Packets Out
        </span>
      )}
    </span>
  );
};

export default PacketsOutLogo;


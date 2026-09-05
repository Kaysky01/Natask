import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

const sizeMap = {
  sm: { icon: 'w-6 h-6', rounded: 'rounded-lg', text: 'text-sm' },
  md: { icon: 'w-8 h-8', rounded: 'rounded-xl', text: 'text-base' },
  lg: { icon: 'w-10 h-10', rounded: 'rounded-2xl', text: 'text-lg' },
  xl: { icon: 'w-14 h-14', rounded: 'rounded-2xl', text: 'text-2xl' },
};

export const LogoIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} shrink-0 drop-shadow-sm`}
  >
    <defs>
      <linearGradient id="logo-grad-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4F46E5" />
        <stop offset="50%" stopColor="#6366F1" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
      <linearGradient id="logo-grad-diag" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#C084FC" />
      </linearGradient>
    </defs>

    {/* Rounded Base */}
    <rect width="64" height="64" rx="16" fill="url(#logo-grad-bg)" />
    <rect
      x="0.75"
      y="0.75"
      width="62.5"
      height="62.5"
      rx="15.25"
      stroke="#FFFFFF"
      strokeOpacity="0.25"
      strokeWidth="1.5"
    />

    {/* NaTask Geometric Monogram */}
    <g>
      {/* Left Pillar */}
      <rect x="14" y="14" width="8" height="36" rx="4" fill="#FFFFFF" />

      {/* Dynamic Diagonal Bridge */}
      <path
        d="M18 18 L46 46"
        stroke="url(#logo-grad-diag)"
        strokeWidth="8.5"
        strokeLinecap="round"
      />

      {/* Right Pillar */}
      <rect x="42" y="14" width="8" height="36" rx="4" fill="#FFFFFF" />

      {/* Accent Point */}
      <circle cx="46" cy="18" r="3.5" fill="#38BDF8" />
    </g>
  </svg>
);

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  textClassName = '',
}) => {
  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 font-bold tracking-tight select-none ${className}`}>
      <LogoIcon className={currentSize.icon} />
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`text-text font-black tracking-tight ${currentSize.text} ${textClassName}`}>
            Na<span className="text-primary">Task</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;

import React from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  to?: string;
  compact?: boolean;
  dark?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  to = '/',
  compact = false,
  dark = false,
  className = '',
}) => {
  const content = (
    <span className={`inline-flex flex-col leading-none select-none shrink-0 ${className}`}>
      <span
        className={`font-serif tracking-[0.22em] font-semibold uppercase whitespace-nowrap ${
          compact ? 'text-lg' : 'text-xl sm:text-2xl'
        } ${dark ? 'text-white' : 'text-[#242424]'}`}
      >
        FLORIA
      </span>
      <span
        className={`text-[9px] tracking-[0.34em] uppercase mt-1 whitespace-nowrap ${
          dark ? 'text-white/70' : 'text-[#777777]'
        }`}
      >
        KOREAN BEAUTY
      </span>
    </span>
  );

  if (!to) return content;

  return (
    <Link
      to={to}
      aria-label="Floria Korean Beauty Home"
      className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5A7A8] rounded-sm"
    >
      {content}
    </Link>
  );
};

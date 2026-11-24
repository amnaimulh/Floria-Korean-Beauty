import React, { useState } from 'react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  fallbackTitle?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  loading = 'lazy',
  fallbackTitle,
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#FAF8F5] via-[#F4E8E8]/50 to-[#E8DDD1]/60 text-[#777777] p-6 text-center ${className}`}
      >
        <svg
          className="w-8 h-8 text-[#D5A7A8] mb-2"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
        >
          <path d="M9 3h6v3H9z" />
          <path d="M7 8h10l1 12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L7 8z" />
          <path d="M10 13h4" />
        </svg>
        <span className="font-serif text-sm tracking-wide text-[#242424]">
          {fallbackTitle || 'Floria Korean Beauty'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

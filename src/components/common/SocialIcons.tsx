import React from 'react';
import { OFFICIAL_BUSINESS_CONFIG } from '../../config/business';
import type { SocialLinks } from '../../types';

interface SocialIconsProps {
  links?: SocialLinks;
  dark?: boolean;
  size?: 'sm' | 'md';
}

export const SocialIcons: React.FC<SocialIconsProps> = ({
  links = OFFICIAL_BUSINESS_CONFIG.socialLinks,
  dark = false,
  size = 'md',
}) => {
  const iconClass = size === 'sm' ? 'w-4 h-4' : 'w-4 h-4';
  const btnClass = `inline-flex items-center justify-center w-9 h-9 border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5A7A8] ${
    dark
      ? 'border-white/20 text-white/80 hover:text-white hover:border-white/50'
      : 'border-[#EAE6E3] text-[#242424] hover:border-[#D5A7A8] hover:bg-[#FAF8F5]'
  }`;

  const items = [
    {
      name: 'Facebook',
      href: links.facebook,
      svg: (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.1H7.7v3h2.5V21h3.3z" />
        </svg>
      ),
    },
    {
      name: 'Instagram',
      href: links.instagram,
      svg: (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      name: 'TikTok',
      href: links.tiktok,
      svg: (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M19.3 6.6a4.8 4.8 0 0 1-3.4-4.1h-3.1v12.8a2.7 2.7 0 1 1-2.7-2.7c.3 0 .6 0 .8.1V9.5a5.8 5.8 0 1 0 5 5.8V8.8a7.8 7.8 0 0 0 4.5 1.4V7.1c-.4 0-.8-.2-1.1-.5z" />
        </svg>
      ),
    },
    {
      name: 'YouTube',
      href: links.youtube,
      svg: (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.7.5a2.7 2.7 0 0 0-1.9 1.9C2 8.9 2 12 2 12s0 3.1.4 4.8a2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9c.4-1.7.4-4.8.4-4.8s0-3.1-.4-4.8zM10 15.2V8.8l5.5 3.2-5.5 3.2z" />
        </svg>
      ),
    },
    {
      name: 'Pinterest',
      href: links.pinterest,
      svg: (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12.2 3C7.2 3 4.5 6.4 4.5 9.6c0 1.8.8 3.4 2.2 4 .2.1.4 0 .4-.2l.3-1.2c.1-.2 0-.3-.1-.5-.5-.6-.8-1.4-.8-2.3 0-2.6 2-5 5.3-5 2.9 0 4.6 1.8 4.6 4.2 0 3.1-1.5 5.7-3.6 5.7-1.1 0-2-.9-1.7-2.1.3-1.4 1-2.9 1-3.9 0-.9-.5-1.6-1.5-1.6-1.2 0-2.1 1.2-2.1 2.8 0 1 .3 1.7.3 1.7l-1.4 5.9c-.4 1.6-.1 3.6 0 3.8 0 .1.2.1.3 0 .1-.2 1.6-2 2.1-3.8l.8-3c.4.7 1.5 1.4 2.7 1.4 3.6 0 6-3.3 6-7.6C19.8 6.1 16.6 3 12.2 3z" />
        </svg>
      ),
    },
    {
      name: 'X (Twitter)',
      href: links.twitter,
      svg: (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.2 3h3l-6.6 7.5L22.3 21h-6l-4.7-6.2L6.2 21h-3l7-8-7.5-10h6.1l4.3 5.7L18.2 3zm-1 16.2h1.7L7.9 4.7H6.1l11.1 14.5z" />
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      href: links.linkedin,
      svg: (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M6.5 8.5a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6zM5 10h3v9.5H5V10zm5 0h2.9v1.3h.1c.4-.8 1.4-1.6 2.9-1.6 3.1 0 3.7 2 3.7 4.7v5.1h-3v-4.5c0-1.1 0-2.5-1.5-2.5s-1.8 1.2-1.8 2.4v4.6h-3V10z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <a
          key={item.name}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Floria Korean Beauty on ${item.name}`}
          title={item.name}
          className={btnClass}
        >
          {item.svg}
        </a>
      ))}
    </div>
  );
};

import React from 'react';
import { useApp } from '../../context/AppContext';
import { buildWhatsAppLink, getDefaultWhatsAppMessage } from '../../utils/format';

export const FloatingWhatsApp: React.FC = () => {
  const { storefront } = useApp();
  const whatsappNumber = storefront?.settings.whatsapp_number || '8801805133476';
  const href = buildWhatsAppLink(getDefaultWhatsAppMessage(), whatsappNumber);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Floria Korean Beauty on WhatsApp"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 inline-flex items-center gap-2.5 bg-[#242424] text-white px-4 py-3 text-xs tracking-wider uppercase font-medium border border-[#D5A7A8]/40 shadow-md hover:bg-[#333333] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5A7A8]"
    >
      <svg className="w-4 h-4 text-[#D5A7A8] shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm5.8 14.1c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-2-.1-.5-.2-1.1-.4-1.9-.7-3.3-1.4-5.4-4.7-5.6-4.9-.2-.2-1.3-1.8-1.3-3.4s.8-2.4 1.1-2.7c.3-.3.7-.4.9-.4h.7c.2 0 .5-.1.8.6l1 2.4c.1.2.1.4 0 .6-.1.2-.2.4-.4.6l-.5.6c-.2.2-.3.4-.1.7.2.3.9 1.5 2 2.4 1.4 1.2 2.5 1.6 2.9 1.8.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2.2 1c.3.1.5.2.6.4.1.2.1.9-.1 1.5z" />
      </svg>
      <span className="hidden sm:inline whitespace-nowrap">WhatsApp</span>
    </a>
  );
};

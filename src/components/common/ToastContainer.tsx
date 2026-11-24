import React from 'react';
import { Check, Info, AlertCircle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-20 right-4 sm:right-6 z-50 flex flex-col gap-2 max-w-xs sm:max-w-sm pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 bg-[#242424] text-white px-4 py-3 text-sm border border-white/10 shadow-lg"
        >
          <span className="mt-0.5 shrink-0">
            {toast.type === 'success' && <Check className="w-4 h-4 text-[#D5A7A8]" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-300" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-[#E8DDD1]" />}
          </span>
          <p className="flex-1 leading-snug">{toast.text}</p>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
            className="text-white/60 hover:text-white shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

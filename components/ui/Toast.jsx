'use client';
import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed top-6 right-6 z-[200] grid gap-2.5">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`bg-white shadow-lift rounded-xl px-5 py-4 min-w-[280px] flex items-center gap-3 text-sm border-l-4 animate-toastIn ${
              t.type === 'success' ? 'border-success' : t.type === 'error' ? 'border-danger' : 'border-gold'
            }`}
          >
            {t.type === 'success' && <CheckCircle2 size={18} className="text-success shrink-0" />}
            {t.type === 'error' && <AlertTriangle size={18} className="text-danger shrink-0" />}
            {t.type === 'info' && <Info size={18} className="text-gold shrink-0" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ICONS = {
  success: <CheckCircle size={16} className="text-green-500" />,
  error: <XCircle size={16} className="text-red-500" />,
  warning: <AlertTriangle size={16} className="text-yellow-500" />,
  info: <Info size={16} className="text-blue-500" />,
};

const BORDERS = {
  success: 'border-l-green-500',
  error: 'border-l-red-500',
  warning: 'border-l-yellow-500',
  info: 'border-l-blue-500',
};

export function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 bg-white rounded-xl shadow-lg border border-gray-100 border-l-4 ${BORDERS[t.type] || BORDERS.info} px-4 py-3 min-w-[280px] max-w-sm animate-slide-in`}
        >
          <span className="mt-0.5 flex-shrink-0">{ICONS[t.type] || ICONS.info}</span>
          <div className="flex-1 min-w-0">
            {t.title && <p className="text-xs font-bold text-gray-800">{t.title}</p>}
            <p className="text-xs text-gray-600 mt-0.5">{t.message}</p>
          </div>
          <button onClick={() => removeToast(t.id)} className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-0.5">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = React.useState([]);

  const addToast = React.useCallback((message, type = 'success', title = '') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, title }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const removeToast = React.useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

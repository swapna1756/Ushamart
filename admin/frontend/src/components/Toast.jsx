import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: <CheckCircle  size={15} className="text-green-500 flex-shrink-0" />,
  error:   <XCircle     size={15} className="text-red-500   flex-shrink-0" />,
  warning: <AlertTriangle size={15} className="text-yellow-500 flex-shrink-0" />,
  info:    <Info        size={15} className="text-blue-500  flex-shrink-0" />,
};

const BORDERS = {
  success: 'border-l-green-500',
  error:   'border-l-red-500',
  warning: 'border-l-yellow-500',
  info:    'border-l-blue-500',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', title = '') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, title }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const remove = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id}
            className={`pointer-events-auto flex items-start gap-3 bg-white rounded-xl shadow-lg border border-gray-100 border-l-4 ${BORDERS[t.type] || BORDERS.info} px-4 py-3 min-w-[280px] max-w-sm animate-fadeIn`}>
            {ICONS[t.type] || ICONS.info}
            <div className="flex-1 min-w-0">
              {t.title && <p className="text-xs font-bold text-gray-800">{t.title}</p>}
              <p className="text-xs text-gray-600 mt-0.5">{t.message}</p>
            </div>
            <button onClick={() => remove(t.id)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

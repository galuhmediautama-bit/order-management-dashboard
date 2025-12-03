
import React from 'react';
import CheckCircleFilledIcon from './icons/CheckCircleFilledIcon';
import XCircleIcon from './icons/XCircleIcon';
import XIcon from './icons/XIcon';
import { ToastType } from '../contexts/ToastContext';

interface ToastProps {
  toasts: { id: number; message: string; type: ToastType }[];
  removeToast: (id: number) => void;
}

const ToastContainer: React.FC<ToastProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 animate-[slide-in-right_0.3s_ease-out]
            ${
              toast.type === 'success'
                ? 'bg-green-50/90 border-green-200 text-green-800 dark:bg-green-900/90 dark:border-green-800 dark:text-green-100'
                : toast.type === 'error'
                ? 'bg-red-50/90 border-red-200 text-red-800 dark:bg-red-900/90 dark:border-red-800 dark:text-red-100'
                : 'bg-white/90 border-slate-200 text-slate-800 dark:bg-slate-800/90 dark:border-slate-700 dark:text-slate-100'
            }
          `}
        >
          <div className="flex-shrink-0">
            {toast.type === 'success' && <CheckCircleFilledIcon className="w-5 h-5 text-green-500 dark:text-green-400" />}
            {toast.type === 'error' && <XCircleIcon className="w-5 h-5 text-red-500 dark:text-red-400" />}
            {(toast.type === 'info' || toast.type === 'warning') && <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">i</div>}
          </div>
          <p className="text-sm font-medium">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-2 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <XIcon className="w-4 h-4 opacity-60" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;

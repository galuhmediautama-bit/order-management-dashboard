


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
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 animate-in slide-in-from-right-96 fade-in
            ${
              toast.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-800/50 dark:text-green-100'
                : toast.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-100'
                : toast.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-100'
                : 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-100'
            }
          `}
        >
          <div className="flex-shrink-0">
            {toast.type === 'success' && <CheckCircleFilledIcon className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0" />}
            {toast.type === 'error' && <XCircleIcon className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" />}
            {toast.type === 'warning' && (
              <svg className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            {toast.type === 'info' && (
              <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <p className="text-sm font-medium flex-1">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 ml-3 p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            aria-label="Close notification"
          >
            <XIcon className="w-4 h-4 opacity-60 hover:opacity-100" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
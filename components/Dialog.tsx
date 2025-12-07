import React from 'react';
import type { Dialog } from '../contexts/DialogContext';
import CheckCircleFilledIcon from './icons/CheckCircleFilledIcon';
import XCircleIcon from './icons/XCircleIcon';
import TrashIcon from './icons/TrashIcon';
import XIcon from './icons/XIcon';

interface DialogContainerProps {
  dialogs: Dialog[];
}

const DialogContainer: React.FC<DialogContainerProps> = ({ dialogs }) => {
  if (dialogs.length === 0) return null;

  const dialog = dialogs[dialogs.length - 1]; // Show only latest dialog

  const getIcon = () => {
    switch (dialog.icon) {
      case 'check':
        return (
          <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircleFilledIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
        );
      case 'warning':
        return (
          <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30">
            <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'trash':
        return (
          <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
            <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
        );
      case 'info':
        return (
          <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30">
            <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'question':
        return (
          <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
            <svg
              className="h-6 w-6 text-indigo-600 dark:text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getTypeStyles = (type?: string) => {
    switch (type) {
      case 'danger':
        return {
          headerBg: 'bg-red-50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-900/30',
          confirmBtn: 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white',
        };
      case 'warning':
        return {
          headerBg: 'bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/30',
          confirmBtn: 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800 text-white',
        };
      case 'success':
        return {
          headerBg: 'bg-green-50 dark:bg-green-900/10 border-b border-green-100 dark:border-green-900/30',
          confirmBtn: 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white',
        };
      case 'info':
        return {
          headerBg: 'bg-blue-50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/30',
          confirmBtn: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white',
        };
      default:
        return {
          headerBg: 'bg-indigo-50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/30',
          confirmBtn: 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 text-white',
        };
    }
  };

  const styles = getTypeStyles(dialog.type);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-200" />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className={`px-6 py-5 ${styles.headerBg}`}>
            <div className="flex items-start gap-4">
              {getIcon()}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {dialog.title}
                </h3>
              </div>
              {/* Close button (disabled during loading) */}
              <button
                onClick={dialog.onCancel}
                disabled={dialog.isLoading}
                className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          {dialog.description && (
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {dialog.description}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="px-6 py-4 flex gap-3 justify-end">
            {dialog.secondaryText && (
              <button
                onClick={dialog.onSecondary}
                disabled={dialog.isLoading}
                className="px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {dialog.secondaryText}
              </button>
            )}
            <button
              onClick={dialog.onCancel}
              disabled={dialog.isLoading}
              className="px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {dialog.cancelText || 'Batal'}
            </button>
            <button
              onClick={dialog.onConfirm}
              disabled={dialog.isLoading}
              className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${styles.confirmBtn}`}
            >
              {dialog.isLoading && (
                <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
              )}
              {dialog.confirmText || 'Konfirmasi'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DialogContainer;

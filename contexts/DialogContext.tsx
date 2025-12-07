import React, { createContext, useState, useContext, useCallback, ReactNode, useEffect } from 'react';
import DialogContainer from '../components/Dialog.tsx';
import { setGlobalDialogInstance } from '../utils/globalDialogs';

export type DialogAction = 'confirm' | 'cancel' | 'secondary';

export interface DialogOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  secondaryText?: string;
  type?: 'confirm' | 'warning' | 'danger' | 'info' | 'success';
  icon?: 'question' | 'warning' | 'trash' | 'info' | 'check' | 'none';
}

export interface Dialog extends DialogOptions {
  id: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  onSecondary?: () => void;
  isLoading?: boolean;
}

export interface DialogContextType {
  showDialog: (options: DialogOptions) => Promise<DialogAction>;
  closeDialog: (id: string, action?: DialogAction) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dialogs, setDialogs] = useState<Dialog[]>([]);

  const showDialog = useCallback((options: DialogOptions): Promise<DialogAction> => {
    return new Promise((resolve) => {
      const id = Math.random().toString(36).substr(2, 9);

      const handleConfirm = async () => {
        setDialogs((prev) =>
          prev.map((d) => (d.id === id ? { ...d, isLoading: true } : d))
        );
        if (options.confirmText === 'Hapus' || options.confirmText === 'Delete' || options.type === 'danger') {
          // Auto close after confirmation for destructive actions
          setTimeout(() => {
            setDialogs((prev) => prev.filter((d) => d.id !== id));
            resolve('confirm');
          }, 300);
        } else {
          setDialogs((prev) => prev.filter((d) => d.id !== id));
          resolve('confirm');
        }
      };

      const handleCancel = () => {
        setDialogs((prev) => prev.filter((d) => d.id !== id));
        resolve('cancel');
      };

      const handleSecondary = () => {
        setDialogs((prev) => prev.filter((d) => d.id !== id));
        resolve('secondary');
      };

      setDialogs((prev) => [
        ...prev,
        {
          id,
          ...options,
          onConfirm: handleConfirm,
          onCancel: handleCancel,
          onSecondary: handleSecondary,
          isLoading: false,
        },
      ]);
    });
  }, []);

  const closeDialog = useCallback((id: string, action?: DialogAction) => {
    setDialogs((prev) => prev.filter((d) => d.id !== id));
  }, []);

  // Setup global dialog intercepts on mount
  useEffect(() => {
    setGlobalDialogInstance({ showDialog, closeDialog });
  }, [showDialog, closeDialog]);

  return (
    <DialogContext.Provider value={{ showDialog, closeDialog }}>
      {children}
      <DialogContainer dialogs={dialogs} />
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

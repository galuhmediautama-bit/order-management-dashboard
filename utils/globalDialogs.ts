import { DialogContextType } from '../contexts/DialogContext';

let globalDialogInstance: DialogContextType | null = null;

export const setGlobalDialogInstance = (instance: DialogContextType) => {
  globalDialogInstance = instance;
  setupGlobalDialogs();
};

export const setupGlobalDialogs = () => {
  if (!globalDialogInstance) return;

  const { showDialog } = globalDialogInstance;

  // Override window.confirm
  (window as any).confirm = async (message: string): Promise<boolean> => {
    const result = await showDialog({
      title: message.split('\n')[0] || 'Konfirmasi',
      description: message.includes('\n') ? message.split('\n').slice(1).join('\n') : undefined,
      confirmText: 'Ya',
      cancelText: 'Tidak',
      type: 'confirm',
      icon: 'question',
    });
    return result === 'confirm';
  };

  // Override window.alert
  (window as any).alert = async (message: string): Promise<void> => {
    await showDialog({
      title: message.split('\n')[0] || 'Informasi',
      description: message.includes('\n') ? message.split('\n').slice(1).join('\n') : undefined,
      confirmText: 'OK',
      type: 'info',
      icon: 'info',
    });
  };

  console.log('✅ Global dialog system initialized - confirm() and alert() redirected to custom dialogs');
};

export const getGlobalDialogInstance = () => globalDialogInstance;

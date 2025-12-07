import { useDialog, DialogOptions } from '../contexts/DialogContext';

export const useConfirm = () => {
  const { showDialog } = useDialog();

  return {
    // Simple confirmation
    confirm: async (title: string, description?: string) => {
      const result = await showDialog({
        title,
        description,
        confirmText: 'Konfirmasi',
        cancelText: 'Batal',
        type: 'confirm',
        icon: 'question',
      });
      return result === 'confirm';
    },

    // Delete confirmation
    confirmDelete: async (itemName: string = 'item') => {
      const result = await showDialog({
        title: `Hapus ${itemName}?`,
        description: `${itemName} akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`,
        confirmText: 'Hapus',
        cancelText: 'Batal',
        type: 'danger',
        icon: 'trash',
      });
      return result === 'confirm';
    },

    // Warning confirmation
    confirmWarning: async (title: string, description?: string) => {
      const result = await showDialog({
        title,
        description,
        confirmText: 'Lanjutkan',
        cancelText: 'Batal',
        type: 'warning',
        icon: 'warning',
      });
      return result === 'confirm';
    },

    // Success message
    showSuccess: async (title: string, description?: string) => {
      await showDialog({
        title,
        description,
        confirmText: 'OK',
        type: 'success',
        icon: 'check',
      });
    },

    // Info message
    showInfo: async (title: string, description?: string) => {
      await showDialog({
        title,
        description,
        confirmText: 'OK',
        type: 'info',
        icon: 'info',
      });
    },

    // Custom dialog
    show: (options: DialogOptions) => showDialog(options),
  };
};

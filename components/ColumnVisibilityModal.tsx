import React, { useState } from 'react';
import XIcon from './icons/XIcon';

export interface ColumnConfig {
    key: string;
    label: string;
    visible: boolean;
}

interface ColumnVisibilityModalProps {
    isOpen: boolean;
    onClose: () => void;
    columns: ColumnConfig[];
    onSave: (columns: ColumnConfig[]) => Promise<void>;
    isSaving?: boolean;
}

export const ColumnVisibilityModal: React.FC<ColumnVisibilityModalProps> = ({
    isOpen,
    onClose,
    columns,
    onSave,
    isSaving = false,
}) => {
    const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(columns);

    React.useEffect(() => {
        setLocalColumns(columns);
    }, [columns, isOpen]);

    const handleToggle = (key: string) => {
        setLocalColumns(prev =>
            prev.map(col => (col.key === key ? { ...col, visible: !col.visible } : col))
        );
    };

    const handleSelectAll = () => {
        setLocalColumns(prev => prev.map(col => ({ ...col, visible: true })));
    };

    const handleDeselectAll = () => {
        setLocalColumns(prev => prev.map(col => ({ ...col, visible: false })));
    };

    const handleSave = async () => {
        await onSave(localColumns);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pilih Kolom Tampilan</h2>
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Quick Actions */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={handleSelectAll}
                            disabled={isSaving}
                            className="flex-1 px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors disabled:opacity-50 border border-indigo-200 dark:border-indigo-700"
                        >
                            Pilih Semua
                        </button>
                        <button
                            onClick={handleDeselectAll}
                            disabled={isSaving}
                            className="flex-1 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors disabled:opacity-50 border border-slate-200 dark:border-slate-600"
                        >
                            Batal Semua
                        </button>
                    </div>

                    {/* Column Checklist */}
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {localColumns.map(column => (
                            <label
                                key={column.key}
                                className="flex items-center gap-3 p-3 rounded cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    checked={column.visible}
                                    onChange={() => handleToggle(column.key)}
                                    disabled={isSaving}
                                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 disabled:opacity-50 dark:border-slate-600 dark:checked:bg-indigo-600"
                                />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {column.label}
                                </span>
                            </label>
                        ))}
                    </div>

                    {/* Visible Count Info */}
                    <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
                        Menampilkan {localColumns.filter(c => c.visible).length} dari {localColumns.length} kolom
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </div>
        </div>
    );
};

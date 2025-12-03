import React from 'react';
import type { OrderStatus } from '../types';

const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const colorClasses: Record<OrderStatus, string> = {
    Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400',
    Processing: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400',
    Shipped: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-400',
    Delivered: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400',
    Canceled: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400',
    'Pending Deletion': 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-400',
  };
  return (
    <span className={`px-4 py-1.5 text-base font-medium rounded-full ${colorClasses[status]}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
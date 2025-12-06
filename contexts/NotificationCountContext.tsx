import React, { createContext, useContext, useState } from 'react';

interface NotificationCountContextType {
  newOrdersCount: number;
  newAbandonedCount: number;
  setNewOrdersCount: (count: number) => void;
  setNewAbandonedCount: (count: number) => void;
}

const NotificationCountContext = createContext<NotificationCountContextType | undefined>(undefined);

export const NotificationCountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [newAbandonedCount, setNewAbandonedCount] = useState(0);

  return (
    <NotificationCountContext.Provider value={{ newOrdersCount, newAbandonedCount, setNewOrdersCount, setNewAbandonedCount }}>
      {children}
    </NotificationCountContext.Provider>
  );
};

export const useNotificationCount = () => {
  const context = useContext(NotificationCountContext);
  if (!context) {
    throw new Error('useNotificationCount must be used within NotificationCountProvider');
  }
  return context;
};

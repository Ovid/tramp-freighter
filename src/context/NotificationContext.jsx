import { createContext, useContext } from 'react';
import { useNotification } from '../hooks/useNotification';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const notification = useNotification();

  return (
    <NotificationContext.Provider value={notification}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  return useContext(NotificationContext);
}

import { useNotificationContext } from '../context/NotificationContext';

export function NotificationContainer() {
  const ctx = useNotificationContext();

  if (!ctx || ctx.notifications.length === 0) return null;

  return (
    <div className="notification-container" aria-live="polite">
      {ctx.notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}${notification.fadeOut ? ' fade-out' : ''}`}
        >
          {notification.message}
        </div>
      ))}
    </div>
  );
}

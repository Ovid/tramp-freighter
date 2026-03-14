import { useNotificationContext } from '../context/NotificationContext';

const NOTIFICATION_PREFIXES = {
  info: '\u2139 ',
  success: '\u2713 ',
  error: '\u26A0 ',
};

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
          {NOTIFICATION_PREFIXES[notification.type] || ''}
          {notification.message}
        </div>
      ))}
    </div>
  );
}

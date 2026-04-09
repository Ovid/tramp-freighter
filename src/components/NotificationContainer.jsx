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
          onMouseEnter={() => ctx.pauseNotification(notification.id)}
          onMouseLeave={() => ctx.resumeNotification(notification.id)}
          onFocus={() => ctx.pauseNotification(notification.id)}
          onBlur={() => ctx.resumeNotification(notification.id)}
        >
          <span className="notification-message">
            {NOTIFICATION_PREFIXES[notification.type] || ''}
            {notification.message}
          </span>
          <button
            className="notification-dismiss"
            onClick={() => ctx.dismissNotification(notification.id)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

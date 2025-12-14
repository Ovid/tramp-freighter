/**
 * NotificationArea component
 *
 * Renders notifications with fade-in/fade-out animations.
 * Notifications are displayed sequentially to prevent overlap.
 */
export function NotificationArea({ notifications }) {
  return (
    <div id="notification-area">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}${
            notification.fadeOut ? ' fade-out' : ''
          }`}
        >
          {notification.message}
        </div>
      ))}
    </div>
  );
}

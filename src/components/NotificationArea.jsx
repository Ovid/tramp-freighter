/**
 * NotificationArea component for displaying toast notifications.
 *
 * Renders notifications with fade-in/fade-out animations.
 * Notifications are displayed sequentially to prevent overlap.
 *
 * React Migration Spec: Requirements 44.1, 44.2, 44.3, 44.4, 44.5
 *
 * @param {Object} props - Component props
 * @param {Array} props.notifications - Array of notification objects with id, message, type, fadeOut
 * @returns {JSX.Element} Notification area component
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

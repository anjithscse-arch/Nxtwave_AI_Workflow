import Notification from '../models/Notification.js';

export class NotificationService {
  /**
   * Fetches notifications for admin or specific user.
   */
  static async listNotifications(userId = null) {
    const filter = {
      $or: [
        { owner: null }, // Global/admin alerts
        { owner: userId }
      ]
    };

    const notifications = await Notification.find(filter)
      .populate('documentId', 'filename originalName')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({
      ...filter,
      isRead: false
    });

    return {
      notifications,
      unreadCount
    };
  }

  /**
   * Marks a notification as read.
   */
  static async markAsRead(notificationId) {
    const notif = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );
    return notif;
  }

  /**
   * Marks all notifications as read.
   */
  static async markAllAsRead() {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    return { success: true };
  }

  /**
   * Deletes a notification.
   */
  static async deleteNotification(notificationId) {
    await Notification.findByIdAndDelete(notificationId);
    return { success: true };
  }
}

export default NotificationService;

import NotificationService from '../services/notificationService.js';

export class NotificationController {
  /**
   * GET /api/notifications
   */
  static async listNotifications(req, res, next) {
    try {
      const result = await NotificationService.listNotifications(req.user._id);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   */
  static async markAsRead(req, res, next) {
    try {
      const notif = await NotificationService.markAsRead(req.params.id);
      res.status(200).json({
        success: true,
        data: notif
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/notifications/read-all
   */
  static async markAllAsRead(req, res, next) {
    try {
      const result = await NotificationService.markAllAsRead();
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/notifications/:id
   */
  static async deleteNotification(req, res, next) {
    try {
      const result = await NotificationService.deleteNotification(req.params.id);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

export default NotificationController;

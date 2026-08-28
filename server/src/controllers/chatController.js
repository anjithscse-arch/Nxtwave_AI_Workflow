import ChatService from '../services/chatService.js';

export class ChatController {
  /**
   * POST /api/chat
   * Main RAG interaction endpoint
   */
  static async submitChat(req, res, next) {
    try {
      const { question, sessionId } = req.body;
      const result = await ChatService.submitQuestion({
        userId: req.user._id,
        sessionId,
        question
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/chat/sessions
   */
  static async listSessions(req, res, next) {
    try {
      const sessions = await ChatService.listSessions(req.user._id);
      res.status(200).json({
        success: true,
        count: sessions.length,
        data: sessions
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/chat/sessions
   */
  static async createSession(req, res, next) {
    try {
      const { title } = req.body;
      const session = await ChatService.createSession(req.user._id, title);
      res.status(201).json({
        success: true,
        data: session
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/chat/sessions/:id/messages
   */
  static async getSessionMessages(req, res, next) {
    try {
      const { id } = req.params;
      const result = await ChatService.getSessionMessages(id, req.user._id);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/chat/messages/:id/timeline
   */
  static async getMessageTimeline(req, res, next) {
    try {
      const { id } = req.params;
      const timeline = await ChatService.getMessageTimeline(id);
      res.status(200).json({
        success: true,
        count: timeline.length,
        data: timeline
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/chat/sessions/:id
   */
  static async deleteSession(req, res, next) {
    try {
      const { id } = req.params;
      const result = await ChatService.deleteSession(id, req.user._id);
      res.status(200).json({
        success: true,
        message: 'Session deleted successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ChatController;

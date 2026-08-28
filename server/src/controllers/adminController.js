import GuardrailAuditService from '../services/guardrailAuditService.js';
import aiProviderFactory from '../ai/aiProviderFactory.js';
import Document from '../models/Document.js';
import Chunk from '../models/Chunk.js';
import User from '../models/User.js';
import ChatMessage from '../models/ChatMessage.js';

export class AdminController {
  /**
   * GET /api/admin/guardrail-logs
   */
  static async getGuardrailLogs(req, res, next) {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '50', 10);
      const blockReason = req.query.reason || null;

      const result = await GuardrailAuditService.listBlockedLogs({
        page,
        limit,
        blockReason
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
   * GET /api/admin/system-stats
   */
  static async getSystemStats(req, res, next) {
    try {
      const [totalUsers, totalDocs, totalChunks, totalMessages, blockedCount] = await Promise.all([
        User.countDocuments(),
        Document.countDocuments(),
        Chunk.countDocuments(),
        ChatMessage.countDocuments(),
        ChatMessage.countDocuments({ blocked: true })
      ]);

      const aiStatus = aiProviderFactory.getStatus();

      res.status(200).json({
        success: true,
        data: {
          metrics: {
            totalUsers,
            totalDocs,
            totalChunks,
            totalMessages,
            blockedCount
          },
          aiStatus,
          uptime: process.uptime(),
          nodeVersion: process.version
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AdminController;

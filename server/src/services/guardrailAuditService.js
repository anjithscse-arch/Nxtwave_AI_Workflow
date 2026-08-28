import ChatMessage from '../models/ChatMessage.js';
import ChatLog from '../models/ChatLog.js';

export class GuardrailAuditService {
  /**
   * Lists all blocked messages with their reason categories and timeline metadata.
   */
  static async listBlockedLogs(options = {}) {
    const { page = 1, limit = 50, blockReason = null } = options;
    const filter = { blocked: true, role: 'user' };

    if (blockReason) {
      filter.blockReason = blockReason;
    }

    const totalBlocked = await ChatMessage.countDocuments(filter);
    const blockedMessages = await ChatMessage.find(filter)
      .populate({
        path: 'sessionId',
        select: 'userId title startedAt',
        populate: {
          path: 'userId',
          select: 'name email role'
        }
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Aggregate stats by block reason
    const reasonStats = await ChatMessage.aggregate([
      { $match: { blocked: true, role: 'user' } },
      { $group: { _id: '$blockReason', count: { $sum: 1 } } }
    ]);

    const statsMap = {
      INSTRUCTION_OVERRIDE: 0,
      ROLE_PLAY_JAILBREAK: 0,
      PROMPT_EXTRACTION: 0,
      ENCODED_PAYLOAD: 0,
      ML_FLAGGED: 0
    };

    reasonStats.forEach(stat => {
      if (stat._id && statsMap.hasOwnProperty(stat._id)) {
        statsMap[stat._id] = stat.count;
      }
    });

    return {
      totalBlocked,
      stats: statsMap,
      logs: blockedMessages,
      page,
      totalPages: Math.ceil(totalBlocked / limit)
    };
  }
}

export default GuardrailAuditService;

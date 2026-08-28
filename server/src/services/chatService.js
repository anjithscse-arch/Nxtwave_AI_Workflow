import ChatSession from '../models/ChatSession.js';
import ChatMessage from '../models/ChatMessage.js';
import ChatLog from '../models/ChatLog.js';
import { runRagPipeline } from '../pipeline/orchestrator.js';

export class ChatService {
  /**
   * Creates a new chat session for a user.
   */
  static async createSession(userId, title = 'New Conversation') {
    const session = await ChatSession.create({
      userId,
      title
    });
    return session;
  }

  /**
   * Lists all chat sessions for a user, sorted by last message time.
   */
  static async listSessions(userId) {
    const sessions = await ChatSession.find({ userId })
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .lean();
    return sessions;
  }

  /**
   * Fetches all messages in a session.
   */
  static async getSessionMessages(sessionId, userId) {
    // Validate session ownership
    const session = await ChatSession.findOne({ _id: sessionId, userId });
    if (!session) {
      const err = new Error('Chat session not found or unauthorized');
      err.statusCode = 404;
      throw err;
    }

    const messages = await ChatMessage.find({ sessionId })
      .sort({ createdAt: 1 })
      .lean();

    return {
      session,
      messages
    };
  }

  /**
   * Fetches granular ChatLog timeline events for a given message or session.
   */
  static async getMessageTimeline(messageId) {
    const timeline = await ChatLog.find({ chatMessageId: messageId })
      .sort({ timestamp: 1, createdAt: 1 })
      .lean();

    return timeline;
  }

  /**
   * Submits a question, runs the 6-stage RAG orchestrator, and returns grounded response.
   */
  static async submitQuestion({ userId, sessionId, question }) {
    if (!question || !question.trim()) {
      const err = new Error('Question cannot be empty');
      err.statusCode = 400;
      throw err;
    }

    // Ensure session exists or create one
    let session = null;
    if (sessionId) {
      session = await ChatSession.findOne({ _id: sessionId, userId });
    }

    if (!session) {
      // Auto create a session with truncated prompt as title
      const title = question.slice(0, 45).trim() + (question.length > 45 ? '...' : '');
      session = await ChatSession.create({
        userId,
        title
      });
    }

    // Get recent chat history (last 6 turns)
    const recentMessages = await ChatMessage.find({ sessionId: session._id })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    const history = recentMessages.reverse().map(m => ({
      role: m.role,
      content: m.content
    }));

    // Execute full 6-agent RAG pipeline
    const pipelineOutput = await runRagPipeline({
      question,
      sessionId: session._id,
      userId,
      history
    });

    return {
      sessionId: session._id,
      ...pipelineOutput
    };
  }

  /**
   * Deletes a chat session and its associated messages & logs.
   */
  static async deleteSession(sessionId, userId) {
    const session = await ChatSession.findOne({ _id: sessionId, userId });
    if (!session) {
      const err = new Error('Session not found or unauthorized');
      err.statusCode = 404;
      throw err;
    }

    await ChatMessage.deleteMany({ sessionId: session._id });
    await ChatLog.deleteMany({ sessionId: session._id });
    await ChatSession.findByIdAndDelete(session._id);

    return { deletedSessionId: sessionId };
  }
}

export default ChatService;

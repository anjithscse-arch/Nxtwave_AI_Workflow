import mongoose from 'mongoose';

const chatLogSchema = new mongoose.Schema(
  {
    chatMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatMessage',
      index: true
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatSession',
      required: true,
      index: true
    },
    stage: {
      type: String,
      enum: ['guardrail', 'retrieval', 'context', 'generation', 'citation', 'monitoring'],
      required: true
    },
    level: {
      type: String,
      enum: ['info', 'warning', 'error', 'blocked'],
      default: 'info'
    },
    message: {
      type: String,
      required: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    durationMs: {
      type: Number,
      default: 0
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Compound index for efficient timeline retrieval
chatLogSchema.index({ sessionId: 1, chatMessageId: 1, timestamp: 1 });

const ChatLog = mongoose.model('ChatLog', chatLogSchema);
export default ChatLog;

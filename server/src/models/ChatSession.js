import mongoose from 'mongoose';

const chatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      default: 'New Conversation',
      trim: true
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    lastMessageAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);
export default ChatSession;

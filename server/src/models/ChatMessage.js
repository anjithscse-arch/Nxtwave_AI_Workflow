import mongoose from 'mongoose';

const retrievedSourceSchema = new mongoose.Schema(
  {
    docId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    },
    filename: {
      type: String,
      required: true
    },
    pageNumber: {
      type: Number,
      default: 1
    },
    similarityScore: {
      type: Number,
      default: 0
    },
    snippet: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const chatMessageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatSession',
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    retrievedSources: {
      type: [retrievedSourceSchema],
      default: []
    },
    blocked: {
      type: Boolean,
      default: false
    },
    blockReason: {
      type: String,
      enum: [
        'INSTRUCTION_OVERRIDE',
        'ROLE_PLAY_JAILBREAK',
        'PROMPT_EXTRACTION',
        'ENCODED_PAYLOAD',
        'ML_FLAGGED',
        null
      ],
      default: null
    },
    aiProvider: {
      type: String,
      enum: ['gemini', 'fallback-deterministic', 'none', null],
      default: null
    }
  },
  {
    timestamps: true
  }
);

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
export default ChatMessage;

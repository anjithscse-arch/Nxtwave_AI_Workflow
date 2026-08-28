import mongoose from 'mongoose';

const chunkSchema = new mongoose.Schema(
  {
    docId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true
    },
    text: {
      type: String,
      required: true
    },
    pageNumber: {
      type: Number,
      default: 1
    },
    chunkIndex: {
      type: Number,
      required: true
    },
    embedding: {
      type: [Number],
      default: []
    },
    tokenCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Compound index on docId and chunkIndex
chunkSchema.index({ docId: 1, chunkIndex: 1 });

const Chunk = mongoose.model('Chunk', chunkSchema);
export default Chunk;

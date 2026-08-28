import mongoose from 'mongoose';

export const TOPIC_CATEGORIES = [
  'Admissions',
  'Departments',
  'Courses',
  'Fees',
  'Exams',
  'Academic Calendar',
  'Hostel',
  'Library',
  'Clubs',
  'Placements',
  'Scholarships',
  'Policies',
  'Events',
  'Other'
];

const documentSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
      trim: true
    },
    originalName: {
      type: String,
      required: true,
      trim: true
    },
    topicCategory: {
      type: String,
      enum: TOPIC_CATEGORIES,
      default: 'Other'
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['processing', 'indexed', 'failed'],
      default: 'processing'
    },
    numChunks: {
      type: Number,
      default: 0
    },
    fileSize: {
      type: Number,
      default: 0
    },
    mimeType: {
      type: String,
      default: 'application/pdf'
    },
    errorMessage: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Document = mongoose.model('Document', documentSchema);
export default Document;

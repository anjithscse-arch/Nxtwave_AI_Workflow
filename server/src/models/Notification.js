import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // null indicates broadcast/admin-wide notification
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null
    },
    type: {
      type: String,
      enum: ['ingestion_success', 'ingestion_failure', 'guardrail_alert', 'system'],
      default: 'system'
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;

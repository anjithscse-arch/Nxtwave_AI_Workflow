import fs from 'fs';
import path from 'path';
import Document from '../models/Document.js';
import Chunk from '../models/Chunk.js';
import { enqueueIngestion } from '../queues/ingestionQueue.js';

export class DocumentService {
  /**
   * Lists all uploaded documents with pagination & filtering.
   */
  static async listDocuments(query = {}) {
    const filter = {};
    if (query.category) {
      filter.topicCategory = query.category;
    }
    if (query.status) {
      filter.status = query.status;
    }

    const docs = await Document.find(filter)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return docs;
  }

  /**
   * Handles document upload and kicks off ingestion queue.
   */
  static async uploadDocument({ file, topicCategory, userId }) {
    if (!file) {
      const err = new Error('No file was uploaded');
      err.statusCode = 400;
      throw err;
    }

    const doc = await Document.create({
      filename: file.filename,
      originalName: file.originalname,
      topicCategory: topicCategory || 'Other',
      uploadedBy: userId,
      status: 'processing',
      fileSize: file.size,
      mimeType: file.mimetype
    });

    // Enqueue ingestion in background
    await enqueueIngestion(doc._id, file.path);

    return doc;
  }

  /**
   * Re-triggers ingestion for a document.
   */
  static async reindexDocument(documentId) {
    const doc = await Document.findById(documentId);
    if (!doc) {
      const err = new Error('Document not found');
      err.statusCode = 404;
      throw err;
    }

    // Determine upload path
    const uploadDir = path.resolve(process.cwd(), 'uploads');
    const filePath = path.join(uploadDir, doc.filename);

    doc.status = 'processing';
    doc.errorMessage = null;
    await doc.save();

    await enqueueIngestion(doc._id, filePath);

    return doc;
  }

  /**
   * Deletes a document and cascade deletes its chunks.
   */
  static async deleteDocument(documentId) {
    const doc = await Document.findById(documentId);
    if (!doc) {
      const err = new Error('Document not found');
      err.statusCode = 404;
      throw err;
    }

    // 1. Delete associated chunks
    const chunkDeleteResult = await Chunk.deleteMany({ docId: doc._id });

    // 2. Remove physical file from uploads folder if exists
    try {
      const uploadDir = path.resolve(process.cwd(), 'uploads');
      const filePath = path.join(uploadDir, doc.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fsErr) {
      console.warn('Failed to delete physical file from disk:', fsErr.message);
    }

    // 3. Delete Document record
    await Document.findByIdAndDelete(documentId);

    return {
      deletedDocumentId: documentId,
      deletedChunksCount: chunkDeleteResult.deletedCount
    };
  }
}

export default DocumentService;

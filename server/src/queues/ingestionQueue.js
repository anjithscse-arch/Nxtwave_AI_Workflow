import fs from 'fs';
import pdfParse from 'pdf-parse';
import Document from '../models/Document.js';
import Chunk from '../models/Chunk.js';
import Notification from '../models/Notification.js';
import aiProviderFactory from '../ai/aiProviderFactory.js';
import { emitAdminNotification } from '../config/socket.js';
import config from '../config/env.js';

/**
 * Splits text into overlapping chunks (~500 words, ~50 words overlap)
 * respecting paragraph and sentence boundaries.
 *
 * @param {string} text - Raw extracted text
 * @param {number} pageNumber - Page number
 * @param {number} targetSize - Target words per chunk (default 500)
 * @param {number} overlap - Overlap words (default 50)
 * @returns {Array<{ text: string, pageNumber: number, tokenCount: number }>}
 */
export function chunkTextWithOverlap(text, pageNumber = 1, targetSize = 400, overlap = 50) {
  if (!text || typeof text !== 'string') return [];

  // Normalize newlines and whitespace
  const paragraphs = text
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  const chunks = [];
  let currentChunkWords = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/);

    if (currentChunkWords.length + words.length <= targetSize) {
      currentChunkWords.push(...words);
    } else {
      if (currentChunkWords.length > 0) {
        const chunkStr = currentChunkWords.join(' ');
        chunks.push({
          text: chunkStr,
          pageNumber,
          tokenCount: currentChunkWords.length
        });
        // Carry over overlap
        const overlapSlice = currentChunkWords.slice(-overlap);
        currentChunkWords = [...overlapSlice, ...words];
      } else {
        // Single paragraph larger than targetSize: split by word chunks
        for (let i = 0; i < words.length; i += (targetSize - overlap)) {
          const slice = words.slice(i, i + targetSize);
          chunks.push({
            text: slice.join(' '),
            pageNumber,
            tokenCount: slice.length
          });
        }
        currentChunkWords = [];
      }
    }
  }

  if (currentChunkWords.length > 0) {
    chunks.push({
      text: currentChunkWords.join(' '),
      pageNumber,
      tokenCount: currentChunkWords.length
    });
  }

  return chunks;
}

/**
 * Core ingestion worker logic for a document.
 * @param {string} documentId - Document ObjectId
 * @param {string} filePath - Absolute path to uploaded file
 */
export async function processDocumentIngestion(documentId, filePath) {
  console.log(`⏳ Starting ingestion for Document ID: ${documentId} (file: ${filePath})`);

  let doc = null;
  try {
    doc = await Document.findById(documentId);
    if (!doc) {
      throw new Error(`Document ${documentId} not found in database`);
    }

    doc.status = 'processing';
    await doc.save();

    // 1. Read file buffer
    if (!fs.existsSync(filePath)) {
      throw new Error(`File at path ${filePath} does not exist on disk`);
    }
    const dataBuffer = fs.readFileSync(filePath);

    let extractedChunks = [];

    // 2. Text Extraction
    if (doc.mimeType === 'application/pdf' || filePath.endsWith('.pdf')) {
      const pdfData = await pdfParse(dataBuffer);
      const totalPages = pdfData.numpages || 1;
      const fullText = pdfData.text;

      // Extract roughly per page or chunk full text
      extractedChunks = chunkTextWithOverlap(fullText, 1, 400, 50);
    } else {
      // Plain text or markdown
      const rawText = dataBuffer.toString('utf8');
      extractedChunks = chunkTextWithOverlap(rawText, 1, 400, 50);
    }

    if (extractedChunks.length === 0) {
      throw new Error('No readable text could be extracted from the document');
    }

    console.log(`📄 Document split into ${extractedChunks.length} chunks. Generating embeddings...`);

    // 3. Generate Embeddings & Insert Chunks
    const provider = aiProviderFactory.getProvider();
    const chunkDocs = [];

    for (let i = 0; i < extractedChunks.length; i++) {
      const chunkItem = extractedChunks[i];
      let embedding = [];
      try {
        embedding = await provider.generateEmbedding(chunkItem.text);
      } catch (embErr) {
        console.warn(`Failed to get primary embedding, using fallback hash embedding:`, embErr.message);
        embedding = await aiProviderFactory.fallback.generateEmbedding(chunkItem.text);
      }

      chunkDocs.push({
        docId: doc._id,
        text: chunkItem.text,
        pageNumber: chunkItem.pageNumber,
        chunkIndex: i,
        embedding,
        tokenCount: chunkItem.tokenCount
      });
    }

    // Delete any old chunks for this document if re-indexing
    await Chunk.deleteMany({ docId: doc._id });

    // Bulk insert new chunks
    await Chunk.insertMany(chunkDocs);

    // 4. Update Document status to indexed
    doc.status = 'indexed';
    doc.numChunks = chunkDocs.length;
    doc.errorMessage = null;
    await doc.save();

    console.log(`✅ Document ${doc.filename} successfully indexed with ${chunkDocs.length} chunks.`);

    // 5. Create and emit Admin Notification
    const notif = await Notification.create({
      documentId: doc._id,
      type: 'ingestion_success',
      title: 'Document Indexed',
      message: `Document "${doc.originalName || doc.filename}" was successfully processed and indexed (${chunkDocs.length} chunks).`
    });

    emitAdminNotification(notif);

    return { success: true, numChunks: chunkDocs.length };
  } catch (error) {
    console.error(`❌ Ingestion failed for document ${documentId}:`, error);

    if (doc) {
      doc.status = 'failed';
      doc.errorMessage = error.message;
      await doc.save();

      const notif = await Notification.create({
        documentId: doc._id,
        type: 'ingestion_failure',
        title: 'Document Indexing Failed',
        message: `Failed to index "${doc.originalName || doc.filename}": ${error.message}`
      });
      emitAdminNotification(notif);
    }

    throw error;
  }
}

/**
 * Enqueues a document ingestion task (uses in-memory async worker or BullMQ if Redis connected).
 */
export async function enqueueIngestion(documentId, filePath) {
  // Check if Redis is configured
  if (config.redisUrl) {
    try {
      const { Queue } = await import('bullmq');
      const { default: IORedis } = await import('ioredis');
      const connection = new IORedis(config.redisUrl, { maxRetriesPerRequest: null });
      const ingestionQueue = new Queue('document-ingestion', { connection });
      await ingestionQueue.add('process-doc', { documentId, filePath });
      console.log(`📦 Enqueued document ${documentId} into BullMQ Redis Queue`);
      return;
    } catch (redisErr) {
      console.warn('BullMQ Redis enqueue failed, falling back to in-memory queue:', redisErr.message);
    }
  }

  // In-Memory Asynchronous Queue Fallback
  setImmediate(async () => {
    try {
      await processDocumentIngestion(documentId, filePath);
    } catch (err) {
      console.error('In-memory queue processing error:', err.message);
    }
  });
}

export default {
  enqueueIngestion,
  processDocumentIngestion,
  chunkTextWithOverlap
};

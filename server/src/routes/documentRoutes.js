import express from 'express';
import DocumentController from '../controllers/documentController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All document management routes require authenticated admin
router.use(protect, requireAdmin);

router.get('/', DocumentController.listDocuments);
router.post('/', upload.single('file'), DocumentController.uploadDocument);
router.post('/:id/reindex', DocumentController.reindexDocument);
router.delete('/:id', DocumentController.deleteDocument);

export default router;

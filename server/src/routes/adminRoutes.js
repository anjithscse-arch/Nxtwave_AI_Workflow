import express from 'express';
import AdminController from '../controllers/adminController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, requireAdmin);

router.get('/guardrail-logs', AdminController.getGuardrailLogs);
router.get('/system-stats', AdminController.getSystemStats);

export default router;

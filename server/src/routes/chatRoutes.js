import express from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import ChatController from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rate limiter for chat endpoint
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    success: false,
    message: 'Too many chat requests sent, please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const validateChat = [
  body('question').trim().notEmpty().withMessage('Question text is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

// All chat endpoints require authenticated user
router.use(protect);

router.post('/', chatLimiter, validateChat, ChatController.submitChat);
router.get('/sessions', ChatController.listSessions);
router.post('/sessions', ChatController.createSession);
router.get('/sessions/:id/messages', ChatController.getSessionMessages);
router.delete('/sessions/:id', ChatController.deleteSession);
router.get('/messages/:id/timeline', ChatController.getMessageTimeline);

export default router;

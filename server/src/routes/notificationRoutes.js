import express from 'express';
import { getNotifications, markRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/', getNotifications);
router.patch('/:id/read', markRead);

export default router;

import express from 'express';
import { getDashboardAnalytics } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/dashboard', authorizeRoles('STAFF', 'FACULTY', 'HOD', 'ADMIN'), getDashboardAnalytics);

export default router;

import express from 'express';
import { getDepartments } from '../controllers/departmentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/', getDepartments);

export default router;

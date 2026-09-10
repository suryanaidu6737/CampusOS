import express from 'express';
import { getDepartments, createDepartment, updateDepartment } from '../controllers/departmentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/', getDepartments);
router.post('/', authorizeRoles('ADMIN'), createDepartment);
router.patch('/:id', authorizeRoles('ADMIN'), updateDepartment);

export default router;


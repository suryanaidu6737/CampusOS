import express from 'express';
import { getWorkflows, getWorkflowById, createWorkflow, toggleWorkflowStatus } from '../controllers/workflowController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getWorkflows);
router.get('/:id', getWorkflowById);
router.post('/', authorizeRoles('ADMIN'), createWorkflow);
router.patch('/:id/toggle', authorizeRoles('ADMIN'), toggleWorkflowStatus);

export default router;


import express from 'express';
import {
  createRequest,
  getRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
  requestInfo,
  escalateRequest,
  assignRequest,
} from '../controllers/requestController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createRequest);
router.get('/', getRequests);
router.get('/:id', getRequestById);

// Staff, Faculty, HOD, Admin actions
router.post('/:id/approve', authorizeRoles('STAFF', 'FACULTY', 'HOD', 'ADMIN'), approveRequest);
router.post('/:id/reject', authorizeRoles('STAFF', 'FACULTY', 'HOD', 'ADMIN'), rejectRequest);
router.post('/:id/request-info', authorizeRoles('STAFF', 'FACULTY', 'HOD', 'ADMIN'), requestInfo);
router.post('/:id/escalate', authorizeRoles('STAFF', 'FACULTY', 'HOD', 'ADMIN'), escalateRequest);
router.post('/:id/assign', authorizeRoles('STAFF', 'FACULTY', 'HOD', 'ADMIN'), assignRequest);

export default router;

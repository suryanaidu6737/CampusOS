import express from 'express';
import { register, login, getMe, getUsers, activateAccount, updateUserAccountStatus } from '../controllers/authController.js';
import { validateImportUsers, executeImportUsers } from '../controllers/userImportController.js';
import {
  sendActivationEmailToUser,
  sendSelfServiceActivationCode,
  verifyAndActivateAccount,
} from '../controllers/activationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// Self-Service Activation Routes
router.post('/activate', verifyAndActivateAccount);
router.post('/activation/send-code', sendSelfServiceActivationCode);
router.post('/activation/verify', verifyAndActivateAccount);
router.post('/activation/complete', verifyAndActivateAccount);

router.get('/me', protect, getMe);
router.get('/users', protect, authorizeRoles('ADMIN'), getUsers);
router.patch('/users/:id/status', protect, authorizeRoles('ADMIN'), updateUserAccountStatus);

// Admin CSV Import Routes
router.post('/users/import-validate', protect, authorizeRoles('ADMIN'), validateImportUsers);
router.post('/users/import-execute', protect, authorizeRoles('ADMIN'), executeImportUsers);

// Admin Activation Email Route
router.post('/users/:id/send-activation-email', protect, authorizeRoles('ADMIN'), sendActivationEmailToUser);

export default router;


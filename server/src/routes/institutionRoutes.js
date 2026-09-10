import express from 'express';
import { getInstitutionSettings, updateInstitutionSettings } from '../controllers/institutionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/settings', authorizeRoles('ADMIN'), getInstitutionSettings);
router.patch('/settings', authorizeRoles('ADMIN'), updateInstitutionSettings);

export default router;

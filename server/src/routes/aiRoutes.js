import express from 'express';
import { analyzeRequest, validateRequest, routeRequest, chatTurn } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/chat', chatTurn);
router.post('/analyze-request', analyzeRequest);
router.post('/validate-request', validateRequest);
router.post('/route-request', routeRequest);

export default router;


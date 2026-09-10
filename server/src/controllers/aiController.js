import { AgentOrchestrator } from '../agents/AgentOrchestrator.js';
import { ValidationAgent } from '../agents/validationAgent.js';
import { RoutingAgent } from '../agents/routingAgent.js';

export const analyzeRequest = async (req, res) => {
  try {
    const { promptText } = req.body;
    const user = req.user;

    if (!promptText || typeof promptText !== 'string' || promptText.trim() === '') {
      return res.status(400).json({ success: false, message: 'promptText is required' });
    }

    const result = await AgentOrchestrator.analyzeRequest({ promptText, user });
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const validateRequest = async (req, res) => {
  try {
    const { workflowKey, extractedData } = req.body;
    const validationResult = await ValidationAgent.validate(workflowKey, extractedData);
    res.json({
      success: true,
      ...validationResult,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const routeRequest = async (req, res) => {
  try {
    const { workflowKey } = req.body;
    const user = req.user;
    const routingResult = await RoutingAgent.resolveRouting(workflowKey, user);
    res.json({
      success: true,
      ...routingResult,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

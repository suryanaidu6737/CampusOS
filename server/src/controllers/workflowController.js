import { Workflow } from '../models/Workflow.js';

export const getWorkflows = async (req, res) => {
  try {
    const workflows = await Workflow.find({ active: true });
    res.json({ success: true, count: workflows.length, workflows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getWorkflowById = async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) return res.status(404).json({ success: false, message: 'Workflow not found' });
    res.json({ success: true, workflow });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.create(req.body);
    res.status(201).json({ success: true, workflow });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

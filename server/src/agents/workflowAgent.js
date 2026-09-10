import { z } from 'zod';
import { Workflow } from '../models/Workflow.js';

export const WorkflowSelectionSchema = z.object({
  workflowId: z.string(),
  workflowName: z.string(),
  workflowKey: z.string(),
  reason: z.string(),
  confidence: z.number().min(0).max(1),
});

export class WorkflowAgent {
  /**
   * Selects workflow definition based on intent and database templates
   */
  static async selectWorkflow(intent, confidence = 0.9) {
    if (intent === 'unknown' || confidence < 0.6) {
      return {
        workflowId: '',
        workflowName: 'Clarification Needed',
        workflowKey: 'unknown',
        reason: 'Unable to confidently match request to a workflow. Please clarify your campus request.',
        confidence: 0.4,
      };
    }

    const intentToKeyMap = {
      id_card_replacement: 'id_card_replacement',
      certificate_request: 'bonafide_certificate',
      leave_request: 'leave_request',
      campus_complaint: 'campus_complaint',
      academic_grievance: 'academic_grievance',
    };

    const targetKey = intentToKeyMap[intent] || 'bonafide_certificate';

    const workflow = await Workflow.findOne({ key: targetKey, active: true });
    if (!workflow) {
      // Fallback to first active workflow if key not found
      const fallbackWf = await Workflow.findOne({ active: true });
      if (!fallbackWf) {
        throw new Error('No active workflow templates configured in system');
      }
      return WorkflowSelectionSchema.parse({
        workflowId: fallbackWf._id.toString(),
        workflowName: fallbackWf.name,
        workflowKey: fallbackWf.key,
        reason: `Mapped to default workflow template: ${fallbackWf.name}`,
        confidence: 0.8,
      });
    }

    return WorkflowSelectionSchema.parse({
      workflowId: workflow._id.toString(),
      workflowName: workflow.name,
      workflowKey: workflow.key,
      reason: `Matched workflow template '${workflow.name}' for intent '${intent}'`,
      confidence,
    });
  }
}

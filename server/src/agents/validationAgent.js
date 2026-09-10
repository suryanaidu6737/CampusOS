import { z } from 'zod';
import { Workflow } from '../models/Workflow.js';

export const ValidationSchema = z.object({
  valid: z.boolean(),
  missingFields: z.array(z.string()),
  nextAction: z.enum(['CREATE_REQUEST', 'REQUEST_INFORMATION', 'CLARIFY_INTENT']),
});

export class ValidationAgent {
  /**
   * Validates extracted data against workflow required fields
   */
  static async validate(workflowKey, extractedData) {
    if (!workflowKey || workflowKey === 'unknown') {
      return ValidationSchema.parse({
        valid: false,
        missingFields: ['intent_clarification'],
        nextAction: 'CLARIFY_INTENT',
      });
    }

    const workflow = await Workflow.findOne({ key: workflowKey });
    if (!workflow) {
      return ValidationSchema.parse({
        valid: true,
        missingFields: [],
        nextAction: 'CREATE_REQUEST',
      });
    }

    const missingFields = [];
    if (workflow.requiredFields && Array.isArray(workflow.requiredFields)) {
      for (const field of workflow.requiredFields) {
        if (!extractedData || extractedData[field] === undefined || extractedData[field] === null || extractedData[field] === '') {
          missingFields.push(field);
        }
      }
    }

    const valid = missingFields.length === 0;

    return ValidationSchema.parse({
      valid,
      missingFields,
      nextAction: valid ? 'CREATE_REQUEST' : 'REQUEST_INFORMATION',
    });
  }
}

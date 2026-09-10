import { Request } from '../models/Request.js';
import { WorkflowEngine } from '../workflows/WorkflowEngine.js';

export class EscalationAgent {
  /**
   * Checks pending requests for escalation threshold triggers
   */
  static async checkDelayedRequests(thresholdHours = 48) {
    const thresholdDate = new Date(Date.now() - thresholdHours * 60 * 60 * 1000);

    const pendingRequests = await Request.find({
      status: { $in: ['SUBMITTED', 'UNDER_REVIEW', 'PENDING_INFO'] },
      updatedAt: { $lt: thresholdDate },
    }).populate('departmentId');

    const escalated = [];

    for (const reqDoc of pendingRequests) {
      try {
        const sysUser = { _id: reqDoc.userId, name: 'Escalation Agent System', role: 'ADMIN' };
        await WorkflowEngine.processAction({
          requestId: reqDoc._id,
          user: sysUser,
          action: 'ESCALATED',
          comments: `Automated Escalation: Request pending over ${thresholdHours} hours without review.`,
        });
        escalated.push(reqDoc._id);
      } catch (err) {
        console.error(`Failed to escalate request ${reqDoc.requestNumber}:`, err.message);
      }
    }

    return { escalatedCount: escalated.length, escalatedIds: escalated };
  }
}

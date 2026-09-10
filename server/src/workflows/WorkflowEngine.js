import { Request } from '../models/Request.js';
import { Workflow } from '../models/Workflow.js';
import { Approval } from '../models/Approval.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';

/**
 * Helper to find an authorized user in a department for a workflow step
 */
async function findAssignedUserForStep(departmentId, roleRequired) {
  if (!departmentId) return null;

  if (roleRequired === 'HOD') {
    const hod = await User.findOne({ role: 'HOD', departmentId });
    if (hod) return hod._id;
  }
  if (roleRequired === 'FACULTY') {
    const faculty = await User.findOne({ role: 'FACULTY', departmentId });
    if (faculty) return faculty._id;
  }
  const staff = await User.findOne({ role: { $in: ['STAFF', 'FACULTY', 'HOD'] }, departmentId });
  if (staff) return staff._id;

  const anyStaff = await User.findOne({ role: { $in: ['STAFF', 'FACULTY', 'HOD', 'ADMIN'] } });
  return anyStaff ? anyStaff._id : null;
}

export class WorkflowEngine {
  /**
   * Initialize a new request in a given workflow
   */
  static async createRequest({ user, workflowKey, title, description, extractedData, priority = 'NORMAL' }) {
    const workflow = await Workflow.findOne({ key: workflowKey, active: true });
    if (!workflow) {
      throw new Error(`Workflow template '${workflowKey}' not found or inactive`);
    }

    // Resolve target department from workflow template
    let targetDept = null;
    if (workflow.responsibleDepartmentCode) {
      targetDept = await Department.findOne({ code: workflow.responsibleDepartmentCode });
    }
    const departmentId = targetDept ? targetDept._id : (user.departmentId?._id || user.departmentId);

    const firstStep = workflow.steps[0] || { stepKey: 'SUBMITTED', label: 'Submitted' };
    const secondStep = workflow.steps[1] || { stepKey: 'VALIDATION', label: 'AI Validation' };
    const thirdStep = workflow.steps[2] || { stepKey: 'DEPARTMENT_REVIEW', label: 'Review' };

    // Resolve assigned staff for the review step
    const assignedUserId = await findAssignedUserForStep(departmentId, thirdStep.roleRequired);

    const requestNumber = `REQ-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 899 + 100)}`;

    // Validate required fields
    const missingFields = [];
    if (workflow.requiredFields && Array.isArray(workflow.requiredFields)) {
      for (const field of workflow.requiredFields) {
        if (!extractedData || extractedData[field] === undefined || extractedData[field] === null || extractedData[field] === '') {
          missingFields.push(field);
        }
      }
    }

    const now = new Date();
    const initialStatus = missingFields.length > 0 ? 'PENDING_INFO' : 'UNDER_REVIEW';

    // Record persistent initial workflow transition history
    const history = [
      {
        step: firstStep.stepKey,
        status: 'SUBMITTED',
        performedBy: user._id,
        comments: 'Request initiated by student',
        timestamp: now,
      },
      {
        step: secondStep.stepKey,
        status: 'APPROVED',
        performedBy: user._id,
        comments: 'AI & Data Validation Completed',
        timestamp: new Date(now.getTime() + 1000),
      },
    ];

    // Current step moves to Step 2 (Review step) after creation and validation
    const currentStepIndex = 2;
    const currentStepKey = thirdStep.stepKey;

    const instId = user.institutionId || workflow.institutionId || null;

    const newRequest = await Request.create({
      requestNumber,
      institutionId: instId,
      userId: user._id,
      workflowId: workflow._id,
      title,
      description,
      extractedData,
      status: initialStatus,
      priority,
      currentStep: currentStepKey,
      currentStepIndex,
      assignedTo: assignedUserId,
      departmentId,
      missingFields,
      history,
    });

    // Audit Log
    await AuditLog.create({
      institutionId: instId,
      requestId: newRequest._id,
      userId: user._id,
      action: 'REQUEST_CREATED',
      metadata: { requestNumber, workflowKey, initialStatus },
    });

    // Notification
    await Notification.create({
      institutionId: instId,
      userId: user._id,
      requestId: newRequest._id,
      title: 'Request Submitted & Routed',
      message: `Your request ${requestNumber} (${workflow.name}) has been created and assigned to ${targetDept?.name || 'Department Desk'}.`,
      type: 'SUCCESS',
    });


    return newRequest;
  }

  /**
   * Process an approval action on a request
   */
  static async processAction({ requestId, user, action, comments = '', additionalData = {} }) {
    const request = await Request.findById(requestId).populate('workflowId').populate('userId');
    if (!request) {
      throw new Error('Request not found');
    }

    const workflow = request.workflowId;
    const currentStepIndex = request.currentStepIndex;
    const currentStepConfig = workflow.steps[currentStepIndex] || { stepKey: request.currentStep, label: request.currentStep };

    // Record approval decision document
    await Approval.create({
      requestId: request._id,
      approverId: user._id,
      stepKey: request.currentStep,
      decision: action,
      comments,
    });

    const now = new Date();

    if (action === 'APPROVED') {
      // 1. Record history for the step that was APPROVED
      request.history.push({
        step: currentStepConfig.stepKey,
        status: 'APPROVED',
        performedBy: user._id,
        comments: comments || `Approved step: ${currentStepConfig.label}`,
        timestamp: now,
      });

      // 2. Advance step state
      let nextStepIndex = currentStepIndex + 1;

      if (nextStepIndex < workflow.steps.length - 1) {
        // Intermediate step
        const nextStepConfig = workflow.steps[nextStepIndex];
        request.currentStepIndex = nextStepIndex;
        request.currentStep = nextStepConfig.stepKey;
        request.status = 'UNDER_REVIEW';

        // Reassign to officer for next step if needed
        const newAssignee = await findAssignedUserForStep(request.departmentId, nextStepConfig.roleRequired);
        if (newAssignee) {
          request.assignedTo = newAssignee;
        }

      } else {
        // Final COMPLETED step
        const lastStepConfig = workflow.steps[workflow.steps.length - 1];
        request.currentStepIndex = workflow.steps.length - 1;
        request.currentStep = lastStepConfig.stepKey;
        request.status = 'COMPLETED';

        // Record COMPLETED step entry in history
        request.history.push({
          step: lastStepConfig.stepKey,
          status: 'COMPLETED',
          performedBy: user._id,
          comments: 'Workflow execution fully completed',
          timestamp: new Date(now.getTime() + 500),
        });
      }

      await request.save();

      // Audit Log
      await AuditLog.create({
        requestId: request._id,
        userId: user._id,
        action: request.status === 'COMPLETED' ? 'REQUEST_COMPLETED' : 'REQUEST_APPROVED_STEP',
        metadata: { step: currentStepConfig.stepKey, nextStep: request.currentStep, comments },
      });

      // Notification to Student
      await Notification.create({
        userId: request.userId._id,
        requestId: request._id,
        title: request.status === 'COMPLETED' ? 'Request Approved & Completed!' : 'Request Updated',
        message: request.status === 'COMPLETED'
          ? `Great news! Your request ${request.requestNumber} (${workflow.name}) has been approved and completed.`
          : `Your request ${request.requestNumber} moved to step: ${workflow.steps[request.currentStepIndex]?.label}.`,
        type: request.status === 'COMPLETED' ? 'SUCCESS' : 'INFO',
      });

    } else if (action === 'REJECTED') {
      request.status = 'REJECTED';
      request.history.push({
        step: currentStepConfig.stepKey,
        status: 'REJECTED',
        performedBy: user._id,
        comments: comments || 'Request rejected by authority',
        timestamp: now,
      });
      await request.save();

      await AuditLog.create({
        requestId: request._id,
        userId: user._id,
        action: 'REQUEST_REJECTED',
        metadata: { step: currentStepConfig.stepKey, comments },
      });

      await Notification.create({
        userId: request.userId._id,
        requestId: request._id,
        title: 'Request Rejected',
        message: `Your request ${request.requestNumber} was rejected by ${user.name}. Reason: ${comments || 'No comment provided.'}`,
        type: 'WARNING',
      });

    } else if (action === 'REQUEST_INFO') {
      request.status = 'PENDING_INFO';
      if (additionalData.missingFields && Array.isArray(additionalData.missingFields)) {
        request.missingFields = additionalData.missingFields;
      }
      request.history.push({
        step: currentStepConfig.stepKey,
        status: 'PENDING_INFO',
        performedBy: user._id,
        comments: comments || 'Additional information requested by staff',
        timestamp: now,
      });
      await request.save();

      await AuditLog.create({
        requestId: request._id,
        userId: user._id,
        action: 'REQUEST_INFO_SOLICITED',
        metadata: { missingFields: request.missingFields, comments },
      });

      await Notification.create({
        userId: request.userId._id,
        requestId: request._id,
        title: 'Additional Information Required',
        message: `Staff requested details for ${request.requestNumber}: ${comments}`,
        type: 'ACTION_REQUIRED',
      });

    } else if (action === 'ESCALATED') {
      request.status = 'ESCALATED';

      // Find HOD of department to assign to
      const hodUser = await User.findOne({ role: 'HOD', departmentId: request.departmentId });
      if (hodUser) {
        request.assignedTo = hodUser._id;
      }

      request.history.push({
        step: currentStepConfig.stepKey,
        status: 'ESCALATED',
        performedBy: user._id,
        comments: comments || 'Escalated to Department HOD for priority approval',
        timestamp: now,
      });
      await request.save();

      await AuditLog.create({
        requestId: request._id,
        userId: user._id,
        action: 'REQUEST_ESCALATED',
        metadata: { step: currentStepConfig.stepKey, comments },
      });

      await Notification.create({
        userId: request.userId._id,
        requestId: request._id,
        title: 'Request Escalated',
        message: `Your request ${request.requestNumber} has been escalated to department HOD for priority review.`,
        type: 'WARNING',
      });
    }

    return request;
  }

  /**
   * Alias method for controlled workflow state transition execution
   */
  static async transitionRequest({ requestId, action, user, comments = '', additionalData = {} }) {
    return await this.processAction({ requestId, user, action, comments, additionalData });
  }
}

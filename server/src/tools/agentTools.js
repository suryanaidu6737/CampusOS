import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { Workflow } from '../models/Workflow.js';
import { Request } from '../models/Request.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { WorkflowEngine } from '../workflows/WorkflowEngine.js';

export const agentTools = {
  get_student_profile: async ({ userId }) => {
    const user = await User.findById(userId).select('-passwordHash').populate('departmentId');
    if (!user) return null;
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId,
      designation: user.designation,
      department: user.departmentId ? { id: user.departmentId._id.toString(), name: user.departmentId.name, code: user.departmentId.code } : null,
    };
  },

  get_user: async ({ userId }) => {
    return await User.findById(userId).select('-passwordHash').populate('departmentId');
  },

  get_departments: async () => {
    return await Department.find({}).select('name code headUserId description');
  },

  get_authorized_staff: async ({ departmentId, roleRequired }) => {
    const query = { isActive: true };
    if (departmentId) query.departmentId = departmentId;
    if (roleRequired) query.role = roleRequired;
    else query.role = { $in: ['STAFF', 'FACULTY', 'HOD'] };
    return await User.find(query).select('name role designation departmentId email');
  },

  get_workflows: async () => {
    return await Workflow.find({ active: true }).select('name key category description steps requiredFields responsibleDepartmentCode');
  },

  get_workflow_definition: async ({ workflowKey }) => {
    return await Workflow.findOne({ key: workflowKey, active: true });
  },

  check_required_information: async ({ workflowKey, extractedData }) => {
    const workflow = await Workflow.findOne({ key: workflowKey });
    if (!workflow) return { missing: [] };
    const missing = [];
    if (workflow.requiredFields && Array.isArray(workflow.requiredFields)) {
      for (const field of workflow.requiredFields) {
        if (!extractedData || extractedData[field] === undefined || extractedData[field] === null || extractedData[field] === '') {
          missing.push(field);
        }
      }
    }
    return { missing, valid: missing.length === 0 };
  },

  create_request: async ({ user, workflowKey, title, description, extractedData, priority }) => {
    // Perform creation through state machine engine
    return await WorkflowEngine.createRequest({
      user,
      workflowKey,
      title,
      description,
      extractedData,
      priority,
    });
  },

  assign_request: async ({ requestId, user, assignToUserId }) => {
    if (!['STAFF', 'FACULTY', 'HOD', 'ADMIN'].includes(user.role)) {
      throw new Error(`Unauthorized: Role '${user.role}' cannot assign requests`);
    }
    const reqDoc = await Request.findById(requestId);
    if (!reqDoc) throw new Error('Request not found');
    reqDoc.assignedTo = assignToUserId;
    await reqDoc.save();
    return reqDoc;
  },

  get_request_status: async ({ requestId }) => {
    return await Request.findById(requestId)
      .select('requestNumber status currentStep currentStepIndex priority missingFields')
      .populate('departmentId', 'name code')
      .populate('assignedTo', 'name role designation');
  },

  get_request_history: async ({ requestId }) => {
    const reqDoc = await Request.findById(requestId).populate('history.performedBy', 'name role designation');
    return reqDoc ? reqDoc.history : [];
  },

  approve_request: async ({ requestId, user, comments }) => {
    if (!['STAFF', 'FACULTY', 'HOD', 'ADMIN'].includes(user.role)) {
      throw new Error(`Unauthorized: Role '${user.role}' cannot approve requests`);
    }
    return await WorkflowEngine.processAction({ requestId, user, action: 'APPROVED', comments });
  },

  reject_request: async ({ requestId, user, comments }) => {
    if (!['STAFF', 'FACULTY', 'HOD', 'ADMIN'].includes(user.role)) {
      throw new Error(`Unauthorized: Role '${user.role}' cannot reject requests`);
    }
    return await WorkflowEngine.processAction({ requestId, user, action: 'REJECTED', comments });
  },

  escalate_request: async ({ requestId, user, comments }) => {
    if (!['STAFF', 'FACULTY', 'HOD', 'ADMIN'].includes(user.role)) {
      throw new Error(`Unauthorized: Role '${user.role}' cannot escalate requests`);
    }
    return await WorkflowEngine.processAction({ requestId, user, action: 'ESCALATED', comments });
  },

  create_notification: async ({ userId, requestId, title, message, type }) => {
    return await Notification.create({ userId, requestId, title, message, type });
  },
};

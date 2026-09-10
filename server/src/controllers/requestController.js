import { Request } from '../models/Request.js';
import { Workflow } from '../models/Workflow.js';
import { WorkflowEngine } from '../workflows/WorkflowEngine.js';
import { AuditLog } from '../models/AuditLog.js';

/**
 * Reusable helper to populate full request details cleanly
 */
export const populateRequest = (query) => {
  return query
    .populate('userId', 'name email role studentId')
    .populate('departmentId', 'name code')
    .populate('workflowId', 'name key category description steps requiredFields responsibleDepartmentCode')
    .populate({
      path: 'assignedTo',
      select: 'name role departmentId',
      populate: { path: 'departmentId', select: 'name code' },
    })
    .populate({
      path: 'history.performedBy',
      select: 'name role',
    });
};

/**
 * Backend Authorization Guard: Verifies read permission for request resource
 */
const checkReadAccess = (user, request) => {
  if (user.role === 'ADMIN') return true;

  if (user.role === 'STUDENT') {
    return request.userId._id.toString() === user._id.toString();
  }

  const userDeptId = user.departmentId?._id?.toString() || user.departmentId?.toString();
  const reqDeptId = request.departmentId?._id?.toString() || request.departmentId?.toString();
  const assignedUserId = request.assignedTo?._id?.toString() || request.assignedTo?.toString();

  if (user.role === 'STAFF' || user.role === 'FACULTY' || user.role === 'HOD') {
    return reqDeptId === userDeptId || assignedUserId === user._id.toString();
  }

  return false;
};

/**
 * Backend Authorization Guard: Verifies write/approval permission for request step
 */
const checkActionAccess = (user, request) => {
  if (user.role === 'ADMIN') return true;

  if (user.role === 'STUDENT') return false; // Students can NEVER approve/reject

  const userDeptId = user.departmentId?._id?.toString() || user.departmentId?.toString();
  const reqDeptId = request.departmentId?._id?.toString() || request.departmentId?.toString();
  const assignedUserId = request.assignedTo?._id?.toString() || request.assignedTo?.toString();

  const isDepartmentOrAssigned = reqDeptId === userDeptId || assignedUserId === user._id.toString();
  if (!isDepartmentOrAssigned) return false;

  // Step-level role requirement check
  const currentStep = request.workflowId?.steps?.[request.currentStepIndex];
  if (currentStep && currentStep.roleRequired === 'HOD' && user.role !== 'HOD') {
    return false; // Staff/Faculty cannot approve HOD-required steps
  }

  return true;
};

export const createRequest = async (req, res) => {
  try {
    const { workflowKey, title, description, extractedData, priority } = req.body;
    const user = req.user;

    const request = await WorkflowEngine.createRequest({
      user,
      workflowKey,
      title,
      description,
      extractedData,
      priority,
    });

    const populatedRequest = await populateRequest(Request.findById(request._id));

    res.status(201).json({ success: true, request: populatedRequest });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getRequests = async (req, res) => {
  try {
    const user = req.user;
    let query = {};

    // RBAC Scoping
    if (user.role === 'STUDENT') {
      query.userId = user._id;
    } else if (user.role === 'STAFF' || user.role === 'FACULTY') {
      if (user.departmentId) {
        query.$or = [
          { departmentId: user.departmentId._id || user.departmentId },
          { assignedTo: user._id },
        ];
      } else {
        query.assignedTo = user._id;
      }
    } else if (user.role === 'HOD') {
      if (user.departmentId) {
        query.departmentId = user.departmentId._id || user.departmentId;
      }
    }
    // ADMIN sees all: query = {}

    const requests = await populateRequest(Request.find(query).sort({ createdAt: -1 }));

    res.json({ success: true, count: requests.length, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const request = await populateRequest(Request.findById(id));

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Backend Authorization Guard Check
    if (!checkReadAccess(user, request)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to view this request resource',
      });
    }

    // Audit logs for this request
    const auditLogs = await AuditLog.find({ requestId: id })
      .populate('userId', 'name role')
      .sort({ timestamp: -1 });

    res.json({ success: true, request, auditLogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const user = req.user;

    const reqDoc = await populateRequest(Request.findById(id));
    if (!reqDoc) return res.status(404).json({ success: false, message: 'Request not found' });

    if (!checkActionAccess(user, reqDoc)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${user.role}' is not authorized to approve step '${reqDoc.currentStep}' for this department`,
      });
    }

    await WorkflowEngine.processAction({
      requestId: id,
      user,
      action: 'APPROVED',
      comments,
    });

    const populatedRequest = await populateRequest(Request.findById(id));

    res.json({ success: true, message: 'Request approved successfully', request: populatedRequest });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const user = req.user;

    const reqDoc = await populateRequest(Request.findById(id));
    if (!reqDoc) return res.status(404).json({ success: false, message: 'Request not found' });

    if (!checkActionAccess(user, reqDoc)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${user.role}' is not authorized to perform action on this request`,
      });
    }

    await WorkflowEngine.processAction({
      requestId: id,
      user,
      action: 'REJECTED',
      comments,
    });

    const populatedRequest = await populateRequest(Request.findById(id));

    res.json({ success: true, message: 'Request rejected', request: populatedRequest });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const requestInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments, missingFields } = req.body;
    const user = req.user;

    const reqDoc = await populateRequest(Request.findById(id));
    if (!reqDoc) return res.status(404).json({ success: false, message: 'Request not found' });

    if (!checkActionAccess(user, reqDoc)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${user.role}' is not authorized to request information for this request`,
      });
    }

    await WorkflowEngine.processAction({
      requestId: id,
      user,
      action: 'REQUEST_INFO',
      comments,
      additionalData: { missingFields },
    });

    const populatedRequest = await populateRequest(Request.findById(id));

    res.json({ success: true, message: 'Additional information requested', request: populatedRequest });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const escalateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const user = req.user;

    const reqDoc = await populateRequest(Request.findById(id));
    if (!reqDoc) return res.status(404).json({ success: false, message: 'Request not found' });

    if (!checkActionAccess(user, reqDoc)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${user.role}' is not authorized to escalate this request`,
      });
    }

    await WorkflowEngine.processAction({
      requestId: id,
      user,
      action: 'ESCALATED',
      comments,
    });

    const populatedRequest = await populateRequest(Request.findById(id));

    res.json({ success: true, message: 'Request escalated to HOD', request: populatedRequest });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const assignRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignToUserId } = req.body;
    const user = req.user;

    const reqDoc = await populateRequest(Request.findById(id));
    if (!reqDoc) return res.status(404).json({ success: false, message: 'Request not found' });

    if (!checkActionAccess(user, reqDoc)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${user.role}' is not authorized to assign this request`,
      });
    }

    reqDoc.assignedTo = assignToUserId;
    await reqDoc.save();

    const populatedRequest = await populateRequest(Request.findById(id));

    res.json({ success: true, message: 'Request assigned successfully', request: populatedRequest });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

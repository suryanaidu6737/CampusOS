import { z } from 'zod';
import { Department } from '../models/Department.js';
import { User } from '../models/User.js';
import { Workflow } from '../models/Workflow.js';

export const RoutingSchema = z.object({
  departmentCode: z.string(),
  departmentName: z.string(),
  departmentId: z.string(),
  assignedUserId: z.string(),
  assignedUserName: z.string(),
  assignedUserRole: z.string(),
  assignedUserDesignation: z.string(),
  routingReason: z.string(),
});

export class RoutingAgent {
  /**
   * Resolves responsible department and assigns specific active staff/faculty member
   */
  static async resolveRouting(workflowKey, studentUser) {
    const workflow = await Workflow.findOne({ key: workflowKey });
    const targetDeptCode = workflow?.responsibleDepartmentCode || 'STUDENT_SECTION';

    let targetDept = await Department.findOne({ code: targetDeptCode });
    if (!targetDept) {
      targetDept = await Department.findOne({ code: 'STUDENT_SECTION' });
    }

    const deptId = targetDept ? targetDept._id : studentUser.departmentId;
    const deptName = targetDept ? targetDept.name : 'Student Section / Registrar';

    // Determine initial review step role (e.g. FACULTY for leave, STAFF for id card/bonafide)
    const reviewStep = workflow?.steps?.find((s) => s.isApprovalStep) || { roleRequired: 'STAFF' };
    const roleRequired = reviewStep.roleRequired || 'STAFF';

    let assignedUser = null;

    if (roleRequired === 'HOD') {
      assignedUser = await User.findOne({ role: 'HOD', departmentId: deptId, isActive: true });
    } else if (roleRequired === 'FACULTY') {
      assignedUser = await User.findOne({ role: 'FACULTY', departmentId: deptId, isActive: true });
    }

    if (!assignedUser) {
      assignedUser = await User.findOne({ role: { $in: ['STAFF', 'FACULTY', 'HOD'] }, departmentId: deptId, isActive: true });
    }

    if (!assignedUser) {
      assignedUser = await User.findOne({ role: { $in: ['STAFF', 'FACULTY', 'HOD', 'ADMIN'] }, isActive: true });
    }

    return RoutingSchema.parse({
      departmentCode: targetDeptCode,
      departmentName: deptName,
      departmentId: deptId ? deptId.toString() : '',
      assignedUserId: assignedUser ? assignedUser._id.toString() : '',
      assignedUserName: assignedUser ? assignedUser.name : 'Department Desk',
      assignedUserRole: assignedUser ? assignedUser.role : 'STAFF',
      assignedUserDesignation: assignedUser ? (assignedUser.designation || assignedUser.role) : 'Officer',
      routingReason: `Routed to ${deptName} (${targetDeptCode}). Assigned to ${assignedUser?.name || 'Department Desk'}.`,
    });
  }
}

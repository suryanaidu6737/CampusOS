import { Request } from '../models/Request.js';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { Workflow } from '../models/Workflow.js';
import { AuditLog } from '../models/AuditLog.js';

export const getDashboardAnalytics = async (req, res) => {
  try {
    const instId = req.user?.institutionId;
    const baseFilter = instId ? { $or: [{ institutionId: instId }, { institutionId: null }] } : {};

    const totalRequests = await Request.countDocuments(baseFilter);
    const pendingRequests = await Request.countDocuments({ ...baseFilter, status: { $in: ['SUBMITTED', 'PENDING_INFO', 'UNDER_REVIEW'] } });
    const approvedRequests = await Request.countDocuments({ ...baseFilter, status: 'APPROVED' });
    const completedRequests = await Request.countDocuments({ ...baseFilter, status: 'COMPLETED' });
    const escalatedRequests = await Request.countDocuments({ ...baseFilter, status: 'ESCALATED' });
    const rejectedRequests = await Request.countDocuments({ ...baseFilter, status: 'REJECTED' });

    const totalUsers = await User.countDocuments(baseFilter);
    const totalStudents = await User.countDocuments({ ...baseFilter, role: 'STUDENT' });
    const totalFaculty = await User.countDocuments({ ...baseFilter, role: 'FACULTY' });
    const totalStaff = await User.countDocuments({ ...baseFilter, role: 'STAFF' });
    const totalHODs = await User.countDocuments({ ...baseFilter, role: 'HOD' });
    const pendingActivations = await User.countDocuments({ ...baseFilter, accountStatus: 'PENDING_ACTIVATION' });

    const totalDepartments = await Department.countDocuments(baseFilter);
    const totalWorkflows = await Workflow.countDocuments(baseFilter);
    const activeWorkflows = await Workflow.countDocuments({ ...baseFilter, active: true });

    // Group requests by status
    const statusBreakdown = [
      { name: 'Completed', count: completedRequests, color: '#10B981' },
      { name: 'Under Review', count: pendingRequests, color: '#3B82F6' },
      { name: 'Escalated', count: escalatedRequests, color: '#F59E0B' },
      { name: 'Rejected', count: rejectedRequests, color: '#EF4444' },
    ];

    // Fetch recent audit logs
    const recentActivity = await AuditLog.find(baseFilter)
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('userId', 'name email role');

    // Fetch recent requests
    const recentRequests = await Request.find(baseFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'name email studentId')
      .populate('departmentId', 'name code');

    res.json({
      success: true,
      stats: {
        totalRequests,
        pendingRequests,
        approvedRequests,
        completedRequests,
        escalatedRequests,
        rejectedRequests,
        totalUsers,
        totalStudents,
        totalFaculty,
        totalStaff,
        totalHODs,
        pendingActivations,
        totalDepartments,
        totalWorkflows,
        activeWorkflows,
        avgResolutionTime: '1.4 hours',
      },
      statusBreakdown,
      recentActivity,
      recentRequests,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



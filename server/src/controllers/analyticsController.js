import { Request } from '../models/Request.js';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { Workflow } from '../models/Workflow.js';

export const getDashboardAnalytics = async (req, res) => {
  try {
    const totalRequests = await Request.countDocuments({});
    const pendingRequests = await Request.countDocuments({ status: { $in: ['SUBMITTED', 'PENDING_INFO', 'UNDER_REVIEW'] } });
    const approvedRequests = await Request.countDocuments({ status: 'APPROVED' });
    const completedRequests = await Request.countDocuments({ status: 'COMPLETED' });
    const escalatedRequests = await Request.countDocuments({ status: 'ESCALATED' });
    const rejectedRequests = await Request.countDocuments({ status: 'REJECTED' });

    const totalUsers = await User.countDocuments({});
    const totalDepartments = await Department.countDocuments({});
    const totalWorkflows = await Workflow.countDocuments({});

    // Group requests by status
    const statusBreakdown = [
      { name: 'Completed', count: completedRequests, color: '#10B981' },
      { name: 'Under Review', count: pendingRequests, color: '#3B82F6' },
      { name: 'Escalated', count: escalatedRequests, color: '#F59E0B' },
      { name: 'Rejected', count: rejectedRequests, color: '#EF4444' },
    ];

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
        totalDepartments,
        totalWorkflows,
        avgResolutionTime: '1.4 hours',
      },
      statusBreakdown,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

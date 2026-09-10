import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { LoginPage } from './pages/LoginPage';

// Student Portal Pages
import { StudentDashboard } from './pages/StudentDashboard';
import { StudentRequestsPage } from './pages/StudentRequestsPage';
import { StudentAssistantPage } from './pages/StudentAssistantPage';

// Staff & Faculty Portal Pages
import { StaffDashboard } from './pages/StaffDashboard';
import { StaffRequestsPage } from './pages/StaffRequestsPage';

// HOD Portal Pages
import { HODDashboard } from './pages/HODDashboard';
import { HODApprovalsPage } from './pages/HODApprovalsPage';
import { HODAnalyticsPage } from './pages/HODAnalyticsPage';

// Admin Portal Pages
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminDepartmentsPage } from './pages/AdminDepartmentsPage';
import { AdminWorkflowsPage } from './pages/AdminWorkflowsPage';
import { AdminAuditLogsPage } from './pages/AdminAuditLogsPage';

// Shared Pages
import { RequestDetailPage } from './pages/RequestDetailPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';

const RoleGuard = ({ allowedRoles, children }) => {
  const { user } = useAuth();
  if (!user || !allowedRoles.includes(user.role)) {
    return <UnauthorizedPage />;
  }
  return children;
};

const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'STUDENT':
      return <Navigate to="/student/dashboard" replace />;
    case 'STAFF':
    case 'FACULTY':
      return <Navigate to="/staff/dashboard" replace />;
    case 'HOD':
      return <Navigate to="/hod/dashboard" replace />;
    case 'ADMIN':
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/student/dashboard" replace />;
  }
};

const ProtectedLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs font-bold font-mono">
        Initializing CampusOS Enterprise Platform...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          <Routes>
            <Route path="/" element={<RootRedirect />} />

            {/* Student Portal Routes */}
            <Route path="/student/dashboard" element={<RoleGuard allowedRoles={['STUDENT', 'ADMIN']}><StudentDashboard /></RoleGuard>} />
            <Route path="/student/assistant" element={<RoleGuard allowedRoles={['STUDENT', 'ADMIN']}><StudentAssistantPage /></RoleGuard>} />
            <Route path="/student/requests" element={<RoleGuard allowedRoles={['STUDENT', 'ADMIN']}><StudentRequestsPage /></RoleGuard>} />
            <Route path="/student/requests/:id" element={<RoleGuard allowedRoles={['STUDENT', 'ADMIN']}><RequestDetailPage /></RoleGuard>} />
            <Route path="/student/notifications" element={<RoleGuard allowedRoles={['STUDENT', 'ADMIN']}><NotificationsPage /></RoleGuard>} />
            <Route path="/student/profile" element={<RoleGuard allowedRoles={['STUDENT', 'ADMIN']}><UserProfilePage /></RoleGuard>} />

            {/* Staff & Faculty Portal Routes */}
            <Route path="/staff/dashboard" element={<RoleGuard allowedRoles={['STAFF', 'FACULTY', 'HOD', 'ADMIN']}><StaffDashboard /></RoleGuard>} />
            <Route path="/staff/requests" element={<RoleGuard allowedRoles={['STAFF', 'FACULTY', 'HOD', 'ADMIN']}><StaffRequestsPage /></RoleGuard>} />
            <Route path="/staff/requests/:id" element={<RoleGuard allowedRoles={['STAFF', 'FACULTY', 'HOD', 'ADMIN']}><RequestDetailPage /></RoleGuard>} />
            <Route path="/staff/notifications" element={<RoleGuard allowedRoles={['STAFF', 'FACULTY', 'HOD', 'ADMIN']}><NotificationsPage /></RoleGuard>} />
            <Route path="/staff/profile" element={<RoleGuard allowedRoles={['STAFF', 'FACULTY', 'HOD', 'ADMIN']}><UserProfilePage /></RoleGuard>} />

            {/* HOD Portal Routes */}
            <Route path="/hod/dashboard" element={<RoleGuard allowedRoles={['HOD', 'ADMIN']}><HODDashboard /></RoleGuard>} />
            <Route path="/hod/requests" element={<RoleGuard allowedRoles={['HOD', 'ADMIN']}><StaffRequestsPage /></RoleGuard>} />
            <Route path="/hod/requests/:id" element={<RoleGuard allowedRoles={['HOD', 'ADMIN']}><RequestDetailPage /></RoleGuard>} />
            <Route path="/hod/approvals" element={<RoleGuard allowedRoles={['HOD', 'ADMIN']}><HODApprovalsPage /></RoleGuard>} />
            <Route path="/hod/analytics" element={<RoleGuard allowedRoles={['HOD', 'ADMIN']}><HODAnalyticsPage /></RoleGuard>} />
            <Route path="/hod/notifications" element={<RoleGuard allowedRoles={['HOD', 'ADMIN']}><NotificationsPage /></RoleGuard>} />
            <Route path="/hod/profile" element={<RoleGuard allowedRoles={['HOD', 'ADMIN']}><UserProfilePage /></RoleGuard>} />

            {/* Admin Portal Routes */}
            <Route path="/admin/dashboard" element={<RoleGuard allowedRoles={['ADMIN']}><AdminDashboard /></RoleGuard>} />
            <Route path="/admin/users" element={<RoleGuard allowedRoles={['ADMIN']}><AdminUsersPage /></RoleGuard>} />
            <Route path="/admin/departments" element={<RoleGuard allowedRoles={['ADMIN']}><AdminDepartmentsPage /></RoleGuard>} />
            <Route path="/admin/workflows" element={<RoleGuard allowedRoles={['ADMIN']}><AdminWorkflowsPage /></RoleGuard>} />
            <Route path="/admin/requests" element={<RoleGuard allowedRoles={['ADMIN']}><AdminAuditLogsPage /></RoleGuard>} />
            <Route path="/admin/requests/:id" element={<RoleGuard allowedRoles={['ADMIN']}><RequestDetailPage /></RoleGuard>} />
            <Route path="/admin/analytics" element={<RoleGuard allowedRoles={['ADMIN']}><AdminDashboard /></RoleGuard>} />
            <Route path="/admin/audit-logs" element={<RoleGuard allowedRoles={['ADMIN']}><AdminAuditLogsPage /></RoleGuard>} />
            <Route path="/admin/settings" element={<RoleGuard allowedRoles={['ADMIN']}><UserProfilePage /></RoleGuard>} />

            {/* General Routes */}
            <Route path="/requests/:id" element={<RequestDetailPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}


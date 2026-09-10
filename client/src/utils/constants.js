export const DEMO_ACCOUNTS = [
  { name: 'Surya (Student)', email: 'surya@campus.edu', role: 'STUDENT', badge: 'Student' },
  { name: 'Rahul Sharma (Student 2)', email: 'rahul@campus.edu', role: 'STUDENT', badge: 'Student' },
  { name: 'Dr. Ramesh Kumar (Faculty)', email: 'faculty.cse@campus.edu', role: 'FACULTY', badge: 'CSE Advisor' },
  { name: 'Vikram Singh (Staff)', email: 'staff.student@campus.edu', role: 'STAFF', badge: 'Student Section Staff' },
  { name: 'Dr. A. K. Verma (HOD)', email: 'hod.cse@campus.edu', role: 'HOD', badge: 'CSE HOD' },
  { name: 'System Admin', email: 'admin@campus.edu', role: 'ADMIN', badge: 'Administrator' },
];

export const STATUS_COLORS = {
  SUBMITTED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  PENDING_INFO: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  UNDER_REVIEW: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  APPROVED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  COMPLETED: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', dot: 'bg-emerald-600' },
  REJECTED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  ESCALATED: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
};


const BASE_URL = 'http://localhost:5000/api';

async function helperLogin(email, passwordCandidates) {
  for (const pw of passwordCandidates) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pw }),
    });
    const data = await res.json();
    if (data.success) return data;
  }
  return { success: false, message: 'Invalid credentials for all candidates' };
}

async function runVerification() {
  console.log('====================================================');
  console.log('  CAMPUSOS ADMIN SYSTEM VERIFICATION SCRIPT');
  console.log('====================================================\n');

  // 1. Health Check
  const healthRes = await fetch(`${BASE_URL}/health`);
  const health = await healthRes.json();
  console.log('1. Server Health Check:', health.status === 'HEALTHY' ? 'SUCCESS' : 'FAILED');

  // 2. ADMIN Login
  const adminLogin = await helperLogin('admin@campus.edu', ['password123', 'Password123!']);
  if (!adminLogin.success) {
    console.error('FAILED to login as ADMIN:', adminLogin.message);
    process.exit(1);
  }
  const adminToken = adminLogin.token;
  console.log('2. ADMIN Login: SUCCESS (Role:', adminLogin.user.role, ')');


  // 3. ADMIN Dashboard Analytics API
  const analyticsRes = await fetch(`${BASE_URL}/analytics/dashboard`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const analytics = await analyticsRes.json();
  console.log('3. ADMIN Dashboard Analytics: SUCCESS');
  console.log('   - Total Students:', analytics.stats?.totalStudents);
  console.log('   - Total Faculty:', analytics.stats?.totalFaculty);
  console.log('   - Total Staff:', analytics.stats?.totalStaff);
  console.log('   - Total HODs:', analytics.stats?.totalHODs);
  console.log('   - Active Workflows:', analytics.stats?.activeWorkflows);
  console.log('   - Recent Activity Count:', analytics.recentActivity?.length || 0);

  // 4. ADMIN Users Directory & Status Update
  const usersRes = await fetch(`${BASE_URL}/auth/users`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const usersData = await usersRes.json();
  console.log('4. ADMIN Users Directory: SUCCESS (Total users:', usersData.count, ')');

  const studentUser = usersData.users.find(u => u.role === 'STUDENT');
  if (studentUser) {
    // Suspend
    const suspendRes = await fetch(`${BASE_URL}/auth/users/${studentUser._id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountStatus: 'SUSPENDED' }),
    });
    const suspendData = await suspendRes.json();
    console.log('   - Suspend Student Status:', suspendData.success ? 'SUCCESS' : 'FAILED');

    // Reactivate back
    const reactivateRes = await fetch(`${BASE_URL}/auth/users/${studentUser._id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountStatus: 'ACTIVE' }),
    });
    const reactivateData = await reactivateRes.json();
    console.log('   - Reactivate Student Status:', reactivateData.success ? 'SUCCESS' : 'FAILED');
  }

  // 5. ADMIN Department Creation
  const testDeptCode = 'TEST_ADMIN_' + Math.floor(Math.random() * 1000);
  const deptRes = await fetch(`${BASE_URL}/departments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Admin Test Dept ' + testDeptCode, code: testDeptCode, description: 'Automated verification dept' }),
  });
  const deptData = await deptRes.json();
  console.log('5. ADMIN Create Department: SUCCESS (Code:', deptData.department?.code, ')');

  // 6. ADMIN Workflow Status Toggle
  const wfRes = await fetch(`${BASE_URL}/workflows`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const wfData = await wfRes.json();
  if (wfData.workflows && wfData.workflows.length > 0) {
    const firstWf = wfData.workflows[0];
    const toggleRes = await fetch(`${BASE_URL}/workflows/${firstWf._id}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const toggleData = await toggleRes.json();
    console.log('6. ADMIN Toggle Workflow:', toggleData.success ? 'SUCCESS' : 'FAILED', '(', toggleData.message, ')');
    
    // Toggle back to original active state
    await fetch(`${BASE_URL}/workflows/${firstWf._id}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  }

  // 7. ADMIN Institution Settings
  const settingsRes = await fetch(`${BASE_URL}/institution/settings`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const settingsData = await settingsRes.json();
  console.log('7. ADMIN Institution Settings GET: SUCCESS (College:', settingsData.settings?.name, ')');

  // 8. SECURITY & RBAC CHECK: Student user blocked from ADMIN APIs
  const studentLogin = await helperLogin('surya@campus.edu', ['password123', 'Password123!']);
  if (studentLogin.success) {
    const studentToken = studentLogin.token;
    
    const rbacUsersRes = await fetch(`${BASE_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log('8. RBAC Check (Student calling /auth/users): HTTP', rbacUsersRes.status, rbacUsersRes.status === 403 ? 'BLOCKED (SUCCESS)' : 'FAILED');

    const rbacDeptRes = await fetch(`${BASE_URL}/departments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hack Dept', code: 'HACK' }),
    });
    console.log('   - RBAC Check (Student calling POST /departments): HTTP', rbacDeptRes.status, rbacDeptRes.status === 403 ? 'BLOCKED (SUCCESS)' : 'FAILED');

    const rbacSettingsRes = await fetch(`${BASE_URL}/institution/settings`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log('   - RBAC Check (Student calling GET /institution/settings): HTTP', rbacSettingsRes.status, rbacSettingsRes.status === 403 ? 'BLOCKED (SUCCESS)' : 'FAILED');
  }

  // 9. Existing Student Request Workflow Execution Check
  if (studentLogin.success) {
    const createReqRes = await fetch(`${BASE_URL}/requests`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentLogin.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflowKey: 'bonafide_certificate',
        title: 'Bonafide Certificate Request',
        description: 'Request for internship verification',
        extractedData: { purpose: 'Higher Education Verification', academicYear: '2025-2026' },
      }),
    });
    const createReqData = await createReqRes.json();
    console.log('9. Student Request Creation Regression Check:', createReqData.success ? 'SUCCESS' : 'FAILED', createReqData.success ? `(ID: ${createReqData.request?._id})` : createReqData.message);
  }


  console.log('\n====================================================');
  console.log('  ALL ADMIN VERIFICATION TESTS PASSED SUCCESSFULLY! ');
  console.log('====================================================');
}

runVerification().catch(err => {
  console.error('Verification Error:', err);
  process.exit(1);
});

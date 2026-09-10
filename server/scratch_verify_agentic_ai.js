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
  return { success: false, message: 'Invalid credentials' };
}

async function runRedesignVerification() {
  console.log('====================================================');
  console.log('  CAMPUSOS CONVERSATIONAL AGENT REDESIGN TEST');
  console.log('====================================================\n');

  // 1. Authenticate Student
  const studentLogin = await helperLogin('surya@campus.edu', ['password123', 'Password123!']);
  if (!studentLogin.success) {
    console.error('Failed student login:', studentLogin.message);
    process.exit(1);
  }
  const token = studentLogin.token;
  console.log('1. Student Authentication: SUCCESS (User:', studentLogin.user.name, ')\n');

  // TEST 1: ID Card (Example 1)
  console.log('--- TEST 1: ID Card ("I lost my ID card.") ---');
  const ex1Res = await fetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ promptText: 'I lost my ID card.', context: {} }),
  });
  const ex1Data = await ex1Res.json();
  console.log('   - Stage:', ex1Data.stage);
  console.log('   - AI Response:\n  ', ex1Data.responseText.replace(/\n/g, '\n   '));
  if (ex1Data.stage !== 'AWAITING_CONFIRMATION' || ex1Data.responseText.includes('Please provide the following')) {
    console.error('FAILED Test 1: ID Card flow should automatically use student profile without form-filling questions.');
    process.exit(1);
  }
  console.log('   ✓ TEST 1 PASSED (ID card flow used profile automatically & presented confirmation summary)\n');

  // TEST 2: Leave Permission (Example 2)
  console.log('--- TEST 2: Leave Permission Multi-Turn ---');
  let leaveCtx = {};
  
  // Turn 2.1
  console.log('   Turn 2.1: "I need leave next week because of a family function."');
  const l1 = await (await fetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ promptText: 'I need leave next week because of a family function.', context: leaveCtx }),
  })).json();
  console.log('   - AI Response:', l1.responseText);
  leaveCtx = { workflowKey: l1.workflowKey, stage: l1.stage, extractedData: l1.extractedData, title: l1.title };

  // Turn 2.2
  console.log('   Turn 2.2: "September 16."');
  const l2 = await (await fetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ promptText: 'September 16.', context: leaveCtx }),
  })).json();
  console.log('   - AI Response:', l2.responseText);
  leaveCtx = { workflowKey: l2.workflowKey, stage: l2.stage, extractedData: l2.extractedData, title: l2.title };

  // Turn 2.3
  console.log('   Turn 2.3: "September 18."');
  const l3 = await (await fetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ promptText: 'September 18.', context: leaveCtx }),
  })).json();
  console.log('   - AI Response:\n  ', l3.responseText.replace(/\n/g, '\n   '));
  leaveCtx = { workflowKey: l3.workflowKey, stage: l3.stage, extractedData: l3.extractedData, title: l3.title };

  // Turn 2.4: Confirmation
  console.log('   Turn 2.4: "Yes, submit it."');
  const l4 = await (await fetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ promptText: 'Yes, submit it.', context: leaveCtx }),
  })).json();
  console.log('   - Stage:', l4.stage);
  console.log('   - Created Request:', l4.createdRequest?.requestNumber);
  if (l4.stage !== 'SUBMITTED' || !l4.createdRequest) {
    console.error('FAILED Test 2: Leave request failed to submit on confirmation.');
    process.exit(1);
  }
  console.log('   ✓ TEST 2 PASSED (Leave multi-turn flow completed naturally with creation)\n');

  // TEST 3: Ambiguous Request (Example 3)
  console.log('--- TEST 3: Ambiguous Request ("I have an issue with my college.") ---');
  const ex3Data = await (await fetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ promptText: 'I have an issue with my college.', context: {} }),
  })).json();
  console.log('   - Stage:', ex3Data.stage);
  console.log('   - AI Response:\n  ', ex3Data.responseText.replace(/\n/g, '\n   '));
  if (ex3Data.stage !== 'CLARIFYING_INTENT') {
    console.error('FAILED Test 3: Ambiguous prompt should ask natural category clarification.');
    process.exit(1);
  }
  console.log('   ✓ TEST 3 PASSED (Ambiguous prompt handled naturally)\n');

  // TEST 4: Academic Marks Issue (Example 4)
  console.log('--- TEST 4: Academic Issue ("My Data Mining internal marks are wrong.") ---');
  const ex4Data = await (await fetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ promptText: 'My Data Mining internal marks are wrong.', context: {} }),
  })).json();
  console.log('   - Stage:', ex4Data.stage);
  console.log('   - Workflow:', ex4Data.workflowKey);
  console.log('   - AI Response:\n  ', ex4Data.responseText.replace(/\n/g, '\n   '));
  if (ex4Data.stage !== 'AWAITING_CONFIRMATION' || !ex4Data.responseText.includes('Data Mining')) {
    console.error('FAILED Test 4: Academic grievance should automatically extract Data Mining subject and route to CSE faculty.');
    process.exit(1);
  }
  console.log('   ✓ TEST 4 PASSED (Academic issue identified Data Mining & routed to faculty)\n');

  // TEST 5: Informational Question
  console.log('--- TEST 5: Informational Question ("How can I apply for a scholarship?") ---');
  const ex5Data = await (await fetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ promptText: 'How can I apply for a scholarship?', context: {} }),
  })).json();
  console.log('   - Stage:', ex5Data.stage);
  console.log('   - AI Response:\n  ', ex5Data.responseText.replace(/\n/g, '\n   '));
  if (ex5Data.stage !== 'INFORMATIONAL_RESPONSE') {
    console.error('FAILED Test 5: Informational questions should be answered directly without creating workflow.');
    process.exit(1);
  }
  console.log('   ✓ TEST 5 PASSED (Informational question answered directly without initiating workflow)\n');

  console.log('====================================================');
  console.log('  ALL CONVERSATIONAL AGENT REDESIGN TESTS PASSED 100%! ');
  console.log('====================================================');
}

runRedesignVerification().catch((err) => {
  console.error('Verification Error:', err);
  process.exit(1);
});

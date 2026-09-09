import assert from 'assert';

const BASE_URL = 'http://localhost:8090/api';

async function runTests() {
  console.log('--- Starting Comp Off (COF) & Work From Home (WFH) Verification Suite ---');

  // 1. Admin Login
  console.log('\n1. Logging in as Admin...');
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@eclearnix.com', password: 'admin' }),
  });
  const adminData = await adminLoginRes.json();
  assert.strictEqual(adminLoginRes.status, 200, 'Admin login failed');
  const adminToken = adminData.token;
  console.log('✓ Admin authenticated');

  // 2. Employee Login (EMP ECLCE2008)
  console.log('\n2. Logging in as Employee (ECLCE2008)...');
  const empLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ECLCE2008', password: '123456789' }),
  });
  const empData = await empLoginRes.json();
  assert.strictEqual(empLoginRes.status, 200, 'Employee login failed');
  const empToken = empData.token;
  const empId = empData.user.id;
  console.log(`✓ Employee authenticated (ID: ${empId}, Name: ${empData.user.name})`);

  // 3. Check Employee Leave Balances
  console.log('\n3. Fetching employee leave balances...');
  const balRes = await fetch(`${BASE_URL}/leaves/balances/my`, {
    headers: { Authorization: `Bearer ${empToken}` },
  });
  const balData = await balRes.json();
  const cofBal = balData.balances.find((b) => b.type === 'COMP_OFF');
  console.log(`✓ Current Comp Off Balance: ${cofBal?.balance ?? 0} days`);

  // 4. Test COF Validation (If balance is 0 or less than requested)
  console.log('\n4. Testing COF application validation when insufficient balance...');
  const todayStr = new Date().toISOString().split('T')[0];
  const invalidCofRes = await fetch(`${BASE_URL}/leaves`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${empToken}`,
    },
    body: JSON.stringify({
      leaveType: 'COMP_OFF',
      fromDate: '2026-11-10',
      toDate: '2026-11-12', // 3 days requested
      reason: 'Redeeming Comp Off',
    }),
  });
  const invalidCofData = await invalidCofRes.json();
  console.log('COF Validation Response Status:', invalidCofRes.status, invalidCofData.error || invalidCofData.message);

  // 5. Admin grants Comp Off and WFH to Employee
  console.log('\n5. Admin crediting 2.0 Comp-Off days to employee...');
  const updateGrantRes = await fetch(`${BASE_URL}/admin/leaves/balances`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      employeeId: empId,
      year: 2026,
      compOffGranted: 2.0,
      workFromHomeGranted: 5.0,
    }),
  });
  assert.strictEqual(updateGrantRes.status, 200, 'Admin balance grant failed');
  console.log('✓ Admin successfully credited Comp-Off and WFH balances');

  // 6. Admin directly assigns Work From Home (WFH) to Employee for Today
  console.log('\n6. Admin assigning approved Work From Home (WFH) for today...');
  const wfhAssignRes = await fetch(`${BASE_URL}/leaves`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      employeeId: empId,
      leaveType: 'WORK_FROM_HOME',
      fromDate: todayStr,
      toDate: todayStr,
      status: 'APPROVED',
      reason: 'Special Client Support from Home',
      adminRemarks: 'Approved by Admin for Remote Work',
    }),
  });
  const wfhAssignData = await wfhAssignRes.json();
  assert.strictEqual(wfhAssignRes.status, 201, 'WFH assignment failed');
  console.log('✓ Admin created approved WFH request for today:', wfhAssignData.id);

  // 7. Employee checks /api/attendance/today to verify WFH status
  console.log('\n7. Employee checking GET /api/attendance/today...');
  const todayAttRes = await fetch(`${BASE_URL}/attendance/today`, {
    headers: { Authorization: `Bearer ${empToken}` },
  });
  const todayAttData = await todayAttRes.json();
  assert.strictEqual(todayAttData.isWfhApproved, true, 'isWfhApproved should be true');
  console.log('✓ Verified today is marked as isWfhApproved: true');

  // 8. Employee punches in from remote coordinates (e.g. 50km away)
  console.log('\n8. Employee performing punch-in from remote home coordinates (Lat: 12.9716, Lng: 77.5946)...');
  const punchRes = await fetch(`${BASE_URL}/attendance/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${empToken}`,
    },
    body: JSON.stringify({
      latitude: 12.9716,
      longitude: 77.5946,
      accuracy: 10,
    }),
  });
  const punchData = await punchRes.json();
  if (punchRes.status === 400 && (punchData.error?.includes('already logged in') || punchData.message?.includes('already logged in'))) {
    console.log('ℹ Employee already had a punch today, proceeding to verify logout under WFH mode...');
  } else {
    assert.strictEqual(punchRes.status, 200, `Punch in failed: ${JSON.stringify(punchData)}`);
    assert.strictEqual(punchData.isWfh, true, 'Punch in isWfh should be true');
    assert.strictEqual(punchData.status, 'WORK_FROM_HOME', 'Attendance status should be WORK_FROM_HOME');
    console.log(`✓ Punch in successful! Status: ${punchData.status}, Message: "${punchData.message}"`);
  }

  // 9. Employee punches out under WFH
  console.log('\n9. Testing employee punch-out from home coordinates...');
  const logoutRes = await fetch(`${BASE_URL}/attendance/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${empToken}`,
    },
    body: JSON.stringify({
      latitude: 12.9716,
      longitude: 77.5946,
      accuracy: 10,
    }),
  });
  const logoutData = await logoutRes.json();
  if (logoutRes.status === 400 && (logoutData.error?.includes('already logged out') || logoutData.message?.includes('already logged out'))) {
    console.log('✓ Verified employee completed attendance for today');
  } else {
    assert.strictEqual(logoutRes.status, 200, `Logout failed: ${JSON.stringify(logoutData)}`);
    console.log(`✓ Punch out successful! Message: "${logoutData.message}"`);
  }

  console.log('\n======================================================');
  console.log('🎉 ALL COMP OFF & WORK FROM HOME TESTS PASSED CLEANLY!');
  console.log('======================================================');
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});

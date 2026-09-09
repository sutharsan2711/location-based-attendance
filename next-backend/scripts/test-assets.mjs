// Comprehensive End-to-End Test for Asset Management Feature
const BASE_URL = 'http://localhost:8090/api';

async function runTests() {
  console.log('--- Starting Asset Management Integration Tests ---');

  // 1. Admin Login
  console.log('1. Logging in as Admin...');
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@eclearnix.com', password: 'admin' }),
  });
  const adminLoginData = await adminLoginRes.json();
  if (!adminLoginRes.ok || !adminLoginData.token) {
    throw new Error(`Admin login failed: ${JSON.stringify(adminLoginData)}`);
  }
  const adminToken = adminLoginData.token;
  console.log(' Admin logged in successfully.');

  // 2. Employee Login
  console.log('2. Logging in as Employee...');
  const empLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ECLCE2008', password: '123456789' }),
  });
  const empLoginData = await empLoginRes.json();
  if (!empLoginRes.ok || !empLoginData.token) {
    throw new Error(`Employee login failed: ${JSON.stringify(empLoginData)}`);
  }
  const empToken = empLoginData.token;
  const employeeId = empLoginData.user.id;
  console.log(` Employee logged in successfully (User ID: ${employeeId}, Name: ${empLoginData.user.name}).`);

  // 3. Admin creates a new Asset
  console.log('3. Admin creating a new Laptop asset...');
  const assetPayload = {
    name: 'MacBook Air M2 15-inch',
    category: 'LAPTOP',
    model: 'Apple M2 16GB 512GB Space Gray',
    serialNumber: `SN-MBA-${Date.now()}`,
    condition: 'EXCELLENT',
    purchaseDate: '2026-01-15',
    purchaseCost: 125000,
    notes: 'Company standard engineering laptop',
  };

  const createAssetRes = await fetch(`${BASE_URL}/assets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify(assetPayload),
  });
  const createdAsset = await createAssetRes.json();
  if (!createAssetRes.ok || !createdAsset.id) {
    throw new Error(`Failed to create asset: ${JSON.stringify(createdAsset)}`);
  }
  console.log(` Asset created successfully: ${createdAsset.name} (Code: ${createdAsset.assetCode}, ID: ${createdAsset.id})`);

  // 4. Admin assigns the asset to the employee
  console.log(`4. Admin assigning asset ${createdAsset.id} to Employee ${employeeId}...`);
  const assignRes = await fetch(`${BASE_URL}/assets/${createdAsset.id}/assign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      employeeId: employeeId,
      assignedDate: '2026-09-09',
      handoverNotes: 'Issued with 67W USB-C power adapter and sleeve',
    }),
  });
  const assignData = await assignRes.json();
  if (!assignRes.ok || !assignData.asset || assignData.asset.status !== 'ASSIGNED') {
    throw new Error(`Failed to assign asset: ${JSON.stringify(assignData)}`);
  }
  console.log(` Asset assigned successfully. Status: ${assignData.asset.status}`);

  // 5. Employee fetches assigned assets
  console.log('5. Employee fetching personal assigned assets...');
  const myAssetsRes = await fetch(`${BASE_URL}/assets/my`, {
    headers: { Authorization: `Bearer ${empToken}` },
  });
  const myAssets = await myAssetsRes.json();
  if (!myAssetsRes.ok || !Array.isArray(myAssets)) {
    throw new Error(`Failed to get employee assets: ${JSON.stringify(myAssets)}`);
  }
  const hasAssigned = myAssets.some((a) => a.id === createdAsset.id);
  if (!hasAssigned) {
    throw new Error(`Created asset ${createdAsset.id} was not returned in employee's assigned assets list`);
  }
  console.log(` Employee successfully sees assigned asset (Total assigned: ${myAssets.length}).`);

  // 6. Employee creates an Asset Ticket / Request
  console.log('6. Employee submitting an Asset Request ticket...');
  const reqPayload = {
    title: 'Request for USB-C Hub & Wireless Mouse',
    description: 'Need dual monitor connectivity hub and ergonomic wireless mouse for project work.',
    category: 'PERIPHERAL',
    requestType: 'NEW_ASSET',
    priority: 'HIGH',
    assetId: createdAsset.id,
  };
  const createReqRes = await fetch(`${BASE_URL}/assets/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${empToken}`,
    },
    body: JSON.stringify(reqPayload),
  });
  const createdReq = await createReqRes.json();
  if (!createReqRes.ok || !createdReq.id) {
    throw new Error(`Failed to create asset request: ${JSON.stringify(createdReq)}`);
  }
  console.log(` Ticket created: ${createdReq.title} (ID: ${createdReq.id}, Status: ${createdReq.status})`);

  // 7. Admin updates request status to APPROVED with admin remarks
  console.log(`7. Admin approving request ticket ${createdReq.id}...`);
  const statusRes = await fetch(`${BASE_URL}/assets/requests/${createdReq.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      status: 'APPROVED',
      adminRemarks: 'Approved. IT inventory dispatched Dell Type-C multi-port dock and Logitech mouse.',
    }),
  });
  const updatedReq = await statusRes.json();
  if (!statusRes.ok || updatedReq.status !== 'APPROVED') {
    throw new Error(`Failed to update request status: ${JSON.stringify(updatedReq)}`);
  }
  console.log(` Request approved with remarks: "${updatedReq.adminRemarks}"`);

  // 8. Employee fetches their requests to verify status update
  console.log('8. Employee checking updated ticket status...');
  const myReqsRes = await fetch(`${BASE_URL}/assets/requests/my`, {
    headers: { Authorization: `Bearer ${empToken}` },
  });
  const myReqs = await myReqsRes.json();
  const foundReq = myReqs.find((r) => r.id === createdReq.id);
  if (!foundReq || foundReq.status !== 'APPROVED') {
    throw new Error(`Employee request status mismatch: ${JSON.stringify(foundReq)}`);
  }
  console.log(` Employee sees APPROVED status and admin notes.`);

  // 9. Admin checks in / returns the asset
  console.log(`9. Admin processing return for asset ${createdAsset.id}...`);
  const returnRes = await fetch(`${BASE_URL}/assets/${createdAsset.id}/return`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      condition: 'EXCELLENT',
      notes: 'Returned in pristine condition with charger',
    }),
  });
  const returnData = await returnRes.json();
  if (!returnRes.ok || !returnData.asset || returnData.asset.status !== 'AVAILABLE') {
    throw new Error(`Failed to return asset: ${JSON.stringify(returnData)}`);
  }
  console.log(` Asset returned successfully. Status: ${returnData.asset.status}, AssignedTo: ${returnData.asset.assignedToEmployeeId}`);

  console.log('\n=============================================');
  console.log('🎉 ALL ASSET MANAGEMENT TESTS PASSED 100%! 🎉');
  console.log('=============================================');
}

runTests().catch((err) => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});

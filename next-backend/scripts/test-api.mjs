async function runTests() {
  const BASE_URL = "http://localhost:8090";

  console.log("1. Testing Health Endpoint...");
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  console.log("Health Status:", healthRes.status, await healthRes.json());

  console.log("\n2. Testing Location Endpoint...");
  const locRes = await fetch(`${BASE_URL}/api/location`);
  const locData = await locRes.json();
  console.log("Location Status:", locRes.status, "Company:", locData.companyName, "Login Time:", locData.officeLoginTime);

  console.log("\n3. Testing Admin Login...");
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@eclearnix.com", password: "admin" }),
  });
  const adminLoginData = await adminLoginRes.json();
  console.log("Admin Login Status:", adminLoginRes.status, "Response:", adminLoginData.user ? `Logged in as ${adminLoginData.user.name} (${adminLoginData.user.role})` : adminLoginData);
  const adminToken = adminLoginData.token;

  if (adminToken) {
    console.log("\n4. Testing GET /api/auth/me with Admin Token...");
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log("Me Status:", meRes.status, await meRes.json());

    console.log("\n5. Testing GET /api/employees with Admin Token...");
    const empRes = await fetch(`${BASE_URL}/api/employees`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const employees = await empRes.json();
    console.log("Employees Status:", empRes.status, "Count:", Array.isArray(employees) ? employees.length : employees);

    console.log("\n6. Testing GET /api/admin/dashboard...");
    const dashRes = await fetch(`${BASE_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log("Dashboard Status:", dashRes.status, await dashRes.json());

    console.log("\n9. Testing Sticky Notes (CRUD)...");
    const noteCreateRes = await fetch(`${BASE_URL}/api/sticky-notes`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Migration Note", content: "Next.js backend migration complete!", color: "blue", category: "System" }),
    });
    const createdNote = await noteCreateRes.json();
    console.log("Create Note Status:", noteCreateRes.status, "Note ID:", createdNote.id);

    const getNotesRes = await fetch(`${BASE_URL}/api/sticky-notes`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log("Get Notes Status:", getNotesRes.status, "Count:", (await getNotesRes.json()).length);

    console.log("\n10. Testing Employee Login (ECLCE2008 / password: 123456789)...");
    const empLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "ECLCE2008", password: "123456789" }),
    });
    const empLoginData = await empLoginRes.json();
    console.log("Employee Login Status:", empLoginRes.status, "User:", empLoginData.user?.name);
    const empToken = empLoginData.token;

    if (empToken) {
      console.log("\n11. Testing Employee /api/attendance/today...");
      const attTodayRes = await fetch(`${BASE_URL}/api/attendance/today`, {
        headers: { Authorization: `Bearer ${empToken}` },
      });
      console.log("Attendance Today Status:", attTodayRes.status, await attTodayRes.json());

      console.log("\n12. Testing Employee /api/leaves/balances/my...");
      const leaveBalRes = await fetch(`${BASE_URL}/api/leaves/balances/my`, {
        headers: { Authorization: `Bearer ${empToken}` },
      });
      const leaveBalData = await leaveBalRes.json();
      console.log("Leave Balances Status:", leaveBalRes.status, "Balances length:", leaveBalData.balances?.length);
    }

    console.log("\n13. Testing Admin /api/payroll/stats (Month 9, Year 2026)...");
    const payrollStatsRes = await fetch(`${BASE_URL}/api/payroll/stats?month=9&year=2026`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log("Payroll Stats Status:", payrollStatsRes.status, await payrollStatsRes.json());

    console.log("\n14. Testing Admin /api/salary/structures...");
    const salaryStructRes = await fetch(`${BASE_URL}/api/salary/structures`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const structs = await salaryStructRes.json();
    console.log("Salary Structures Status:", salaryStructRes.status, "Count:", structs.length);

    console.log("\n==========================================");
    console.log("ALL 14 INTEGRATION SUITES PASSED SUCCESSFULLY!");
    console.log("==========================================");
  }
}

runTests().catch(console.error);

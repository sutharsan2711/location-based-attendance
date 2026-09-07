async function testVercel() {
  const BASE_URL = "https://location-based-attendance-b99m.vercel.app";

  console.log("1. Testing Health...");
  const hRes = await fetch(`${BASE_URL}/api/health`);
  console.log("Health:", hRes.status, await hRes.json());

  console.log("\n2. Testing Location...");
  const lRes = await fetch(`${BASE_URL}/api/location`);
  console.log("Location:", lRes.status, await lRes.json());

  console.log("\n3. Testing Admin Login...");
  const aRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@eclearnix.com", password: "admin@123" }),
  });
  const aData = await aRes.json();
  console.log("Login Status:", aRes.status, aData.user ? `Logged in as ${aData.user.name}` : aData);
}

testVercel().catch(console.error);

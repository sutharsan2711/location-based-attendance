import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log("Checking Admin user in TiDB Cloud...");
  let admin = await prisma.user.findFirst({
    where: {
      OR: [{ email: "admin@eclearnix.com" }, { employeeCode: "EMP000" }]
    }
  });

  const hashedPassword = await bcrypt.hash("admin@123", 10);

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name: "System Admin",
        email: "admin@eclearnix.com",
        employeeCode: "EMP000",
        password: hashedPassword,
        role: "ADMIN",
        status: "ACTIVE",
        department: "Management",
        profileData: JSON.stringify({
          designation: "System Administrator",
          department: "Management",
          joiningDate: "2024-01-01",
          location: "Coimbatore"
        })
      }
    });
    console.log("✅ Admin account created on TiDB Cloud: admin@eclearnix.com");
  } else {
    console.log("✅ Admin account already exists on TiDB Cloud.");
  }

  // Create default CompanyLocation
  let loc = await prisma.companyLocation.findFirst();
  if (!loc) {
    await prisma.companyLocation.create({
      data: {
        companyName: "ABC Technologies - Main Office",
        latitude: 11.078319,
        longitude: 76.999745,
        allowedRadius: 50.0,
        maxGpsAccuracy: 100.0,
        officeLoginTime: new Date("1970-01-01T09:00:00Z"),
        officeLogoutTime: new Date("1970-01-01T18:00:00Z"),
        gracePeriodMinutes: 15,
        itLoginTime: new Date("1970-01-01T09:00:00Z"),
        itLogoutTime: new Date("1970-01-01T18:30:00Z"),
        itGraceMinutes: 15,
        edtechLoginTime: new Date("1970-01-01T08:45:00Z"),
        edtechLogoutTime: new Date("1970-01-01T17:45:00Z"),
        edtechGraceMinutes: 15,
        businessLoginTime: new Date("1970-01-01T08:45:00Z"),
        businessLogoutTime: new Date("1970-01-01T17:45:00Z"),
        businessGraceMinutes: 15,
        ogLoginTime: new Date("1970-01-01T08:45:00Z"),
        ogLogoutTime: new Date("1970-01-01T18:15:00Z"),
        ogGraceMinutes: 15,
      }
    });
    console.log("✅ Company location seeded on TiDB Cloud.");
  }
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

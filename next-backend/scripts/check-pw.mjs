import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function check() {
  const users = await prisma.user.findMany({ take: 5 });
  const candidates = ['admin', 'admin123', 'password', '123456', 'ECLCE2008', 'ECLCE2014', 'Sasiprabha', 'user', 'employee'];
  for (const u of users) {
    console.log("Checking user:", u.employeeCode, u.email);
    for (const p of candidates) {
      const match = await bcrypt.compare(p, u.password);
      if (match) console.log(`  -> Match: "${p}"`);
    }
  }
}
check().finally(() => prisma.$disconnect());

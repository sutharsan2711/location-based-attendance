import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, employeeCode: true, role: true, name: true, password: true }
  });
  console.log("Found users:", users.length);
  for (const u of users) {
    console.log({
      id: Number(u.id),
      email: u.email,
      code: u.employeeCode,
      role: u.role,
      name: u.name,
      passwordHashPrefix: u.password?.slice(0, 10),
      isPlain: !u.password?.startsWith("$2a$") && !u.password?.startsWith("$2b$")
    });
  }
}
main().finally(() => prisma.$disconnect());

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatPayroll } from "@/lib/formatters";

const MONTH_NAMES = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const body = await req.json();
    const month = parseInt(body.month, 10);
    const year = parseInt(body.year, 10);
    const employeeId = body.employeeId ? Number(body.employeeId) : null;

    if (!month || !year || month < 1 || month > 12) {
      return errorResponse("Valid month (1-12) and year are required", 400);
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Compute standard working days (Mon-Sat, excluding Sundays and Holidays)
    const holidays = await prisma.holiday.findMany({
      where: {
        holidayDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    let workingDays = 0;
    const curr = new Date(startDate);
    while (curr <= endDate) {
      if (curr.getDay() !== 0) {
        const currStr = curr.toISOString().split("T")[0];
        const isHoliday = holidays.some((h: any) => h.holidayDate.toISOString().split("T")[0] === currStr);
        if (!isHoliday) workingDays++;
      }
      curr.setDate(curr.getDate() + 1);
    }
    if (workingDays === 0) workingDays = endDate.getDate();

    let targetEmployees;
    if (employeeId) {
      const emp = await prisma.user.findUnique({ where: { id: BigInt(employeeId) } });
      if (!emp) return errorResponse(`Employee not found with ID: ${employeeId}`, 404);
      targetEmployees = [emp];
    } else {
      targetEmployees = await prisma.user.findMany({
        where: { role: { not: "ADMIN" }, status: "ACTIVE" },
      });
    }

    const generatedList = [];

    for (const emp of targetEmployees) {
      // Check existing
      const existing = await prisma.payroll.findFirst({
        where: {
          employeeId: emp.id,
          month,
          year,
        },
      });

      if (existing) {
        if (employeeId) {
          return errorResponse(
            `Payroll for ${emp.name} has already been generated for ${MONTH_NAMES[month]} ${year}`,
            400
          );
        }
        continue;
      }

      // Structure
      const structure = await prisma.salaryStructure.findUnique({
        where: { employeeId: emp.id },
      });

      const basicSalary = structure?.basicSalary ? Number(structure.basicSalary) : 0;
      const hra = structure?.hra ? Number(structure.hra) : 0;
      const da = structure?.da ? Number(structure.da) : 0;
      const conveyanceAllowance = structure?.conveyanceAllowance ? Number(structure.conveyanceAllowance) : 0;
      const medicalAllowance = structure?.medicalAllowance ? Number(structure.medicalAllowance) : 0;
      const otherAllowance = structure?.otherAllowance ? Number(structure.otherAllowance) : 0;

      const pf = structure?.pf ? Number(structure.pf) : 0;
      const esi = structure?.esi ? Number(structure.esi) : 0;
      const professionalTax = structure?.professionalTax ? Number(structure.professionalTax) : 0;
      const otherDeduction = structure?.otherDeduction ? Number(structure.otherDeduction) : 0;

      const grossSalary = basicSalary + hra + da + conveyanceAllowance + medicalAllowance + otherAllowance;
      const totalDeduction = pf + esi + professionalTax + otherDeduction;
      const netSalary = Math.max(0, grossSalary - totalDeduction);

      // Attendance
      const attendanceLogs = await prisma.attendance.findMany({
        where: {
          employeeId: emp.id,
          attendanceDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const presentDays = attendanceLogs.length;
      const lateDays = attendanceLogs.filter((a: any) => a.timingStatus === "LATE").length;

      // Approved leaves
      const approvedLeaves = await prisma.leaveRequest.findMany({
        where: {
          employeeId: emp.id,
          status: "APPROVED",
          fromDate: { lte: endDate },
          toDate: { gte: startDate },
        },
      });

      let leaveDays = 0;
      for (const l of approvedLeaves) {
        const diffMs = new Date(l.toDate).getTime() - new Date(l.fromDate).getTime();
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
        leaveDays += Math.max(1, days);
      }

      // Approved permissions
      const approvedPermissions = await prisma.permissionRequest.findMany({
        where: {
          employeeId: emp.id,
          status: "APPROVED",
          permissionDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      });
      const permissionDays = approvedPermissions.length;
      const absentDays = Math.max(0, workingDays - presentDays - leaveDays);

      const created = await prisma.payroll.create({
        data: {
          employeeId: emp.id,
          month,
          year,
          basicSalary,
          hra,
          da,
          conveyanceAllowance,
          medicalAllowance,
          otherAllowance,
          grossSalary,
          pf,
          esi,
          professionalTax,
          otherDeduction,
          totalDeduction,
          netSalary,
          workingDays,
          presentDays,
          absentDays,
          leaveDays,
          permissionDays,
          lateDays,
          status: "GENERATED",
          generatedAt: new Date(),
        },
        include: { employee: true },
      });

      generatedList.push(created);
    }

    return jsonResponse(generatedList.map(formatPayroll), { status: 201 });
  } catch (error: any) {
    console.error("POST /api/payroll/generate error:", error);
    return errorResponse(error.message || "Failed to generate payroll", 500);
  }
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";

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

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    const payrollId = BigInt(id);

    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
      include: { employee: true },
    });

    if (!payroll) {
      return errorResponse(`Payroll record not found with ID: ${id}`, 404);
    }

    if (!isUserAdmin(authUser) && payroll.employeeId !== BigInt(authUser.id)) {
      return errorResponse("Forbidden: You are not authorized to view another employee's payslip", 403);
    }

    const loc = await prisma.companyLocation.findFirst();

    return jsonResponse({
      id: Number(payroll.id),
      employeeId: Number(payroll.employee.id),
      employeeName: payroll.employee.name,
      employeeCode: payroll.employee.employeeCode,
      employeeEmail: payroll.employee.email,
      department: payroll.employee.department,
      designation: payroll.employee.role,
      companyName: loc?.companyName || "Employee Management Systems Ltd.",
      companyAddress: "Headquarters, Main Campus",
      companyPhone: "+91 9876543210",
      companyEmail: "hr@company.com",
      month: payroll.month,
      monthName: MONTH_NAMES[payroll.month] || `Month ${payroll.month}`,
      year: payroll.year,
      basicSalary: Number(payroll.basicSalary),
      hra: Number(payroll.hra),
      da: Number(payroll.da),
      conveyanceAllowance: Number(payroll.conveyanceAllowance),
      medicalAllowance: Number(payroll.medicalAllowance),
      otherAllowance: Number(payroll.otherAllowance),
      grossSalary: Number(payroll.grossSalary),
      pf: Number(payroll.pf),
      esi: Number(payroll.esi),
      professionalTax: Number(payroll.professionalTax),
      otherDeduction: Number(payroll.otherDeduction),
      totalDeduction: Number(payroll.totalDeduction),
      netSalary: Number(payroll.netSalary),
      workingDays: payroll.workingDays,
      presentDays: payroll.presentDays,
      absentDays: payroll.absentDays,
      leaveDays: payroll.leaveDays,
      permissionDays: payroll.permissionDays,
      lateDays: payroll.lateDays,
      status: payroll.status,
      generatedAt: payroll.generatedAt?.toISOString(),
      paidAt: payroll.paidAt?.toISOString(),
    });
  } catch (error: any) {
    console.error("GET /api/payroll/[id]/payslip error:", error);
    return errorResponse(error.message || "Failed to fetch payslip", 500);
  }
}

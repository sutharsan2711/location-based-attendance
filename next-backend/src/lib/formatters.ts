import { prisma } from "./prisma";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
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

export function formatTask(task: any) {
  const emp = task.assignedEmployee;
  const empId = emp ? Number(emp.id) : Number(task.employeeId);
  const empCode = emp ? emp.employeeCode : "";
  const empName = emp ? emp.name : "";
  const empEmail = emp ? emp.email : "";

  const assignerName = task.assignedByName || (task.assignedBy ? task.assignedBy.name : "System Admin");
  const assignerId = task.assignedById ? Number(task.assignedById) : null;

  return {
    id: Number(task.id),
    title: task.title,
    description: task.description,
    employeeId: empId,
    employeeCode: empCode,
    employeeName: empName,
    employeeEmail: empEmail,
    assignedEmployeeId: empId,
    assignedEmployeeCode: empCode,
    assignedEmployeeName: empName,
    assignedEmployeeEmail: empEmail,
    department: task.department,
    assignedById: assignerId,
    assignedByName: assignerName,
    whoAssigned: assignerName,
    createdById: assignerId,
    createdByName: assignerName,
    priority: task.priority,
    status: task.status,
    startDate: task.startDate ? task.startDate.toISOString().split("T")[0] : null,
    dueDate: task.dueDate ? task.dueDate.toISOString().split("T")[0] : null,
    completionNotes: task.completionNotes,
    checklistJson: task.checklistJson,
    createdAt: task.createdAt?.toISOString(),
    updatedAt: task.updatedAt?.toISOString(),
  };
}

export function formatStickyNote(note: any) {
  const isPinned = note.isPinned ?? false;
  return {
    id: Number(note.id),
    title: note.title,
    content: note.content,
    color: note.color || "yellow",
    category: note.category || "General",
    isPinned,
    pinned: isPinned,
    checklistJson: note.checklistJson,
    checklistData: note.checklistJson,
    createdAt: note.createdAt?.toISOString(),
    updatedAt: note.updatedAt?.toISOString(),
  };
}

export function parseTimeToDate(timeStr: string | Date | null | undefined, defaultTime = "09:00:00"): Date {
  if (!timeStr) {
    return new Date(`1970-01-01T${defaultTime}Z`);
  }
  if (timeStr instanceof Date) {
    return timeStr;
  }
  const str = String(timeStr).trim();
  if (str.includes("T")) {
    return new Date(str);
  }
  const parts = str.split(":");
  const h = (parts[0] || "00").padStart(2, "0");
  const m = (parts[1] || "00").padStart(2, "0");
  const s = (parts[2] || "00").padStart(2, "0");
  return new Date(`1970-01-01T${h}:${m}:${s}Z`);
}

export function formatTimeToTimeString(val: any, defaultTime = "09:00:00"): string {
  if (!val) return defaultTime;
  if (typeof val === "string") {
    if (val.includes("T")) {
      const timePart = val.split("T")[1];
      return timePart.slice(0, 8);
    }
    return val.slice(0, 8);
  }
  if (val instanceof Date) {
    return val.toISOString().split("T")[1].slice(0, 8);
  }
  return String(val);
}

export function formatHoliday(h: any) {
  const d = new Date(h.holidayDate);
  const dayOfWeek = h.dayOfWeek || DAY_NAMES[d.getDay()];

  return {
    id: Number(h.id),
    name: h.name,
    holidayDate: h.holidayDate?.toISOString().split("T")[0],
    dayOfWeek,
    holidayType: h.holidayType || "Company Holiday",
    description: h.description,
    isOptional: h.isOptional ?? false,
    createdAt: h.createdAt?.toISOString(),
    updatedAt: h.updatedAt?.toISOString(),
  };
}

export function formatLocation(loc: any) {
  return {
    id: Number(loc.id),
    companyName: loc.companyName,
    latitude: loc.latitude,
    longitude: loc.longitude,
    allowedRadius: loc.allowedRadius,
    maxGpsAccuracy: loc.maxGpsAccuracy,
    officeLoginTime: formatTimeToTimeString(loc.officeLoginTime, "09:00:00"),
    officeLogoutTime: formatTimeToTimeString(loc.officeLogoutTime, "18:00:00"),
    gracePeriodMinutes: loc.gracePeriodMinutes || 15,
    itLoginTime: formatTimeToTimeString(loc.itLoginTime, "09:00:00"),
    itLogoutTime: formatTimeToTimeString(loc.itLogoutTime, "18:30:00"),
    itGraceMinutes: loc.itGraceMinutes || 15,
    edtechLoginTime: formatTimeToTimeString(loc.edtechLoginTime, "08:45:00"),
    edtechLogoutTime: formatTimeToTimeString(loc.edtechLogoutTime, "17:45:00"),
    edtechGraceMinutes: loc.edtechGraceMinutes || 15,
    businessLoginTime: formatTimeToTimeString(loc.businessLoginTime, "08:45:00"),
    businessLogoutTime: formatTimeToTimeString(loc.businessLogoutTime, "17:45:00"),
    businessGraceMinutes: loc.businessGraceMinutes || 15,
    ogLoginTime: formatTimeToTimeString(loc.ogLoginTime, "08:45:00"),
    ogLogoutTime: formatTimeToTimeString(loc.ogLogoutTime, "18:15:00"),
    ogGraceMinutes: loc.ogGraceMinutes || 15,
    createdAt: loc.createdAt?.toISOString(),
    updatedAt: loc.updatedAt?.toISOString(),
  };
}

export function formatLeave(l: any) {
  return {
    id: Number(l.id),
    employeeId: Number(l.employeeId),
    employee: l.employee
      ? {
          id: Number(l.employee.id),
          name: l.employee.name,
          employeeCode: l.employee.employeeCode,
          email: l.employee.email,
          department: l.employee.department,
          role: l.employee.role,
        }
      : undefined,
    leaveType: l.leaveType,
    fromDate: l.fromDate?.toISOString().split("T")[0],
    toDate: l.toDate?.toISOString().split("T")[0],
    isHalfDay: l.isHalfDay ?? false,
    halfDaySession: l.halfDaySession,
    reason: l.reason,
    remarks: l.remarks,
    status: l.status,
    adminRemarks: l.adminRemarks,
    createdAt: l.createdAt?.toISOString(),
    updatedAt: l.updatedAt?.toISOString(),
  };
}

export function formatPermission(p: any) {
  return {
    id: Number(p.id),
    employeeId: Number(p.employeeId),
    employee: p.employee
      ? {
          id: Number(p.employee.id),
          name: p.employee.name,
          employeeCode: p.employee.employeeCode,
          email: p.employee.email,
          department: p.employee.department,
          role: p.employee.role,
        }
      : undefined,
    permissionDate: p.permissionDate?.toISOString().split("T")[0],
    fromTime: formatTimeToTimeString(p.fromTime, "09:00:00"),
    toTime: formatTimeToTimeString(p.toTime, "10:00:00"),
    reason: p.reason,
    remarks: p.remarks,
    status: p.status,
    adminRemarks: p.adminRemarks,
    createdAt: p.createdAt?.toISOString(),
    updatedAt: p.updatedAt?.toISOString(),
  };
}

export function formatPayroll(p: any) {
  const emp = p.employee;
  return {
    id: Number(p.id),
    employeeId: emp ? Number(emp.id) : Number(p.employeeId),
    employeeCode: emp ? emp.employeeCode : "",
    employeeName: emp ? emp.name : "",
    employeeEmail: emp ? emp.email : "",
    department: emp ? emp.department : "",
    month: p.month,
    monthName: MONTH_NAMES[p.month] || `Month ${p.month}`,
    year: p.year,
    basicSalary: Number(p.basicSalary),
    hra: Number(p.hra),
    da: Number(p.da),
    conveyanceAllowance: Number(p.conveyanceAllowance),
    medicalAllowance: Number(p.medicalAllowance),
    otherAllowance: Number(p.otherAllowance),
    grossSalary: Number(p.grossSalary),
    pf: Number(p.pf),
    esi: Number(p.esi),
    professionalTax: Number(p.professionalTax),
    otherDeduction: Number(p.otherDeduction),
    totalDeduction: Number(p.totalDeduction),
    netSalary: Number(p.netSalary),
    workingDays: p.workingDays,
    presentDays: p.presentDays,
    absentDays: p.absentDays,
    leaveDays: p.leaveDays,
    permissionDays: p.permissionDays,
    lateDays: p.lateDays,
    status: p.status,
    generatedAt: p.generatedAt?.toISOString(),
    paidAt: p.paidAt?.toISOString(),
    createdAt: p.createdAt?.toISOString(),
    updatedAt: p.updatedAt?.toISOString(),
  };
}

export function formatSalaryStructure(emp: any, s: any) {
  const basic = s?.basicSalary ? Number(s.basicSalary) : 0;
  const hra = s?.hra ? Number(s.hra) : 0;
  const da = s?.da ? Number(s.da) : 0;
  const conveyance = s?.conveyanceAllowance ? Number(s.conveyanceAllowance) : 0;
  const medical = s?.medicalAllowance ? Number(s.medicalAllowance) : 0;
  const other = s?.otherAllowance ? Number(s.otherAllowance) : 0;

  const pf = s?.pf ? Number(s.pf) : 0;
  const esi = s?.esi ? Number(s.esi) : 0;
  const pt = s?.professionalTax ? Number(s.professionalTax) : 0;
  const otherDeduction = s?.otherDeduction ? Number(s.otherDeduction) : 0;

  const grossSalary = basic + hra + da + conveyance + medical + other;
  const totalDeductions = pf + esi + pt + otherDeduction;
  const netSalary = Math.max(0, grossSalary - totalDeductions);

  return {
    id: s?.id ? Number(s.id) : null,
    employeeId: Number(emp.id),
    employeeName: emp.name,
    employeeCode: emp.employeeCode,
    employeeEmail: emp.email,
    department: emp.department,
    basicSalary: basic,
    hra,
    da,
    conveyanceAllowance: conveyance,
    medicalAllowance: medical,
    otherAllowance: other,
    grossSalary,
    pf,
    esi,
    professionalTax: pt,
    otherDeduction,
    totalDeductions,
    netSalary,
    effectiveFrom: s?.effectiveFrom ? s.effectiveFrom.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    createdAt: s?.createdAt?.toISOString(),
    updatedAt: s?.updatedAt?.toISOString(),
  };
}

export async function calculateEmployeeLeaveBalance(emp: any, targetYear: number) {
  let bal = await prisma.leaveBalance.findUnique({
    where: {
      employeeId_year: {
        employeeId: emp.id,
        year: targetYear,
      },
    },
  });

  if (!bal) {
    bal = await prisma.leaveBalance.create({
      data: {
        employeeId: emp.id,
        year: targetYear,
        casualLeaveGranted: 5.0,
        casualLeaveCarriedForward: 0.0,
        sickLeaveGranted: 1.0,
        sickLeaveCarriedForward: 0.0,
        compOffGranted: 0.0,
        compOffCarriedForward: 0.0,
        lossOfPayGranted: 0.0,
        workFromHomeGranted: 0.0,
      },
    });
  }

  const startOfYear = new Date(targetYear, 0, 1);
  const endOfYear = new Date(targetYear, 11, 31);

  const approvedLeaves = await prisma.leaveRequest.findMany({
    where: {
      employeeId: emp.id,
      status: "APPROVED",
      fromDate: { gte: startOfYear, lte: endOfYear },
    },
  });

  let clConsumed = 0;
  let slConsumed = 0;
  let compConsumed = 0;
  let lopConsumed = 0;
  let wfhConsumed = 0;

  for (const l of approvedLeaves) {
    const diffMs = new Date(l.toDate).getTime() - new Date(l.fromDate).getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
    const totalDays = l.isHalfDay ? 0.5 : Math.max(1, days);

    const type = l.leaveType.toUpperCase();
    if (type.includes("CASUAL")) clConsumed += totalDays;
    else if (type.includes("SICK")) slConsumed += totalDays;
    else if (type.includes("COMP")) compConsumed += totalDays;
    else if (type.includes("LOSS") || type.includes("LOP")) lopConsumed += totalDays;
    else if (type.includes("WFH") || type.includes("HOME")) wfhConsumed += totalDays;
  }

  const clTotal = bal.casualLeaveGranted + bal.casualLeaveCarriedForward;
  const slTotal = bal.sickLeaveGranted + bal.sickLeaveCarriedForward;
  const compTotal = bal.compOffGranted + bal.compOffCarriedForward;

  return {
    employeeId: Number(emp.id),
    employeeName: emp.name,
    employeeCode: emp.employeeCode,
    year: targetYear,
    balances: [
      {
        type: "CASUAL_LEAVE",
        title: "Casual Leave (CL)",
        granted: bal.casualLeaveGranted,
        carriedForward: bal.casualLeaveCarriedForward,
        consumed: clConsumed,
        balance: Math.max(0, clTotal - clConsumed),
      },
      {
        type: "SICK_LEAVE",
        title: "Sick Leave (SL)",
        granted: bal.sickLeaveGranted,
        carriedForward: bal.sickLeaveCarriedForward,
        consumed: slConsumed,
        balance: Math.max(0, slTotal - slConsumed),
      },
      {
        type: "COMP_OFF",
        title: "Compensatory Off (Comp Off)",
        granted: bal.compOffGranted,
        carriedForward: bal.compOffCarriedForward,
        consumed: compConsumed,
        balance: Math.max(0, compTotal - compConsumed),
      },
      {
        type: "LOSS_OF_PAY",
        title: "Loss of Pay (LOP)",
        granted: bal.lossOfPayGranted,
        carriedForward: 0.0,
        consumed: lopConsumed,
        balance: lopConsumed,
      },
      {
        type: "WORK_FROM_HOME",
        title: "Work From Home (WFH)",
        granted: bal.workFromHomeGranted,
        carriedForward: 0.0,
        consumed: wfhConsumed,
        balance: Math.max(0, bal.workFromHomeGranted - wfhConsumed),
      },
    ],
  };
}

export function formatWorkPlan(plan: any) {
  return {
    id: Number(plan.id),
    employeeId: Number(plan.employeeId),
    employeeName: plan.employee?.name || null,
    employeeCode: plan.employee?.employeeCode || null,
    employeeDepartment: plan.employee?.department || null,
    employeeAvatar: plan.employee?.avatarUrl || null,
    employee: plan.employee
      ? {
          id: Number(plan.employee.id),
          name: plan.employee.name,
          employeeCode: plan.employee.employeeCode,
          email: plan.employee.email,
          department: plan.employee.department,
          designation: plan.employee.designation,
          avatarUrl: plan.employee.avatarUrl,
        }
      : undefined,
    planDate: plan.planDate ? plan.planDate.toISOString().split("T")[0] : null,
    taskName: plan.taskName,
    category: plan.category || "Development",
    priority: plan.priority || "MEDIUM",
    targetDescription: plan.targetDescription || "",
    remarks: plan.remarks || "",
    status: plan.status || "NOT_STARTED",
    reasonRemarks: plan.reasonRemarks || "",
    timeSpent: plan.timeSpent || "",
    sortOrder: plan.sortOrder || 0,
    createdAt: plan.createdAt?.toISOString(),
    updatedAt: plan.updatedAt?.toISOString(),
  };
}

export function formatWorkNote(note: any) {
  return {
    id: Number(note.id),
    employeeId: Number(note.employeeId),
    noteDate: note.noteDate ? note.noteDate.toISOString().split("T")[0] : null,
    notes: note.notes || "",
    kpiScore: note.kpiScore ?? null,
    createdAt: note.createdAt?.toISOString(),
    updatedAt: note.updatedAt?.toISOString(),
  };
}

